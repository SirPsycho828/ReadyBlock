import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, UserCircle, MapPin, Users,
  Phone, PawPrint, Package, Wrench, Globe, ShieldAlert, X, Loader2,
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { updateHousehold, updateSensitiveData } from '@/services/household.service';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const STEPS = [
  { key: 'yourName', icon: UserCircle },
  { key: 'address', icon: MapPin },
  { key: 'basics', icon: Users },
  { key: 'contacts', icon: Phone },
  { key: 'pets', icon: PawPrint },
  { key: 'resources', icon: Package },
  { key: 'skills', icon: Wrench },
  { key: 'languages', icon: Globe },
  { key: 'needs', icon: ShieldAlert },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [data, setData] = useState({
    firstName: user?.displayName?.split(' ')[0] || '',
    lastName: user?.displayName?.split(' ').slice(1).join(' ') || '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    memberCount: 1,
    adultCount: 1,
    childCount: 0,
    petType: '',
    petCount: 0,
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    languagesSpoken: ['en'],
    sharingScope: 'none',
  });

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  async function handleNext() {
    if (step === 0) {
      // Save name to Firebase Auth
      if (!data.firstName.trim()) return;
      const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...user, displayName });
      setStep(step + 1);
      return;
    }

    if (step === 1) {
      // Save address, then wait for Cloud Function to geocode and assign neighborhood
      if (!data.address.trim() || !data.city.trim() || !data.state.trim() || !data.zip.trim()) return;
      setVerifying(true);
      const addressLine = data.address2?.trim()
        ? `${data.address}, ${data.address2}`
        : data.address;
      const fullAddress = `${addressLine}, ${data.city}, ${data.state} ${data.zip}`;
      const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

      try {
        // Create user doc (skip if exists)
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email || '',
            displayName,
            language: 'en',
            darkMode: 'system',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          });
        } catch { /* may already exist */ }

        // Create household doc — triggers onHouseholdCreate Cloud Function
        try {
          await setDoc(doc(db, 'households', user.uid), {
            address: fullAddress,
            name: displayName,
            memberCount: 1,
            adultCount: 1,
            childCount: 0,
            status: 'active',
            profileComplete: false,
            enteredBy: user.uid,
            isCoordinatorEntered: false,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp(),
            lastModifiedBy: user.uid,
          });
        } catch (err) {
          if (err.code === 'permission-denied') {
            const { updateDoc } = await import('firebase/firestore');
            await updateDoc(doc(db, 'households', user.uid), {
              address: fullAddress,
              name: displayName,
              lastModified: serverTimestamp(),
              lastModifiedBy: user.uid,
            });
          }
        }

        // Wait for the Cloud Function to geocode and assign neighborhood.
        // Listen for assignmentStatus changes on the household doc.
        const householdRef = doc(db, 'households', user.uid);
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            unsubscribe();
            // Timed out waiting — still proceed (assignment may complete later)
            resolve();
          }, 15000);

          const unsubscribe = onSnapshot(householdRef, (snap) => {
            const d = snap.data();
            if (!d) return;
            const status = d.assignmentStatus;
            if (status === 'assigned' || status === 'unassigned' || status === 'geocode-failed') {
              clearTimeout(timeout);
              unsubscribe();
              if (status === 'geocode-failed') {
                toast.error('We couldn\'t verify that address. Please check it and try again.');
                reject(new Error('geocode-failed'));
              } else {
                if (status === 'assigned' && d.neighborhoodId) {
                  toast.success(`Matched to ${d.neighborhoodName || 'your neighborhood'}!`);
                }
                resolve();
              }
            }
          });
        });
      } catch (err) {
        if (err.message === 'geocode-failed') {
          setVerifying(false);
          return;
        }
        console.error('Address save error:', err);
        toast.error(t('common.error'));
        setVerifying(false);
        return;
      }
      setVerifying(false);
      setStep(step + 1);
      return;
    }

    if (step < STEPS.length - 1) {
      // Save incrementally
      await updateHousehold(user.uid, data);
      setStep(step + 1);
    } else {
      // Final step -- save everything to proper collections
      setSaving(true);

      // Save household basics
      await updateHousehold(user.uid, {
        memberCount: data.memberCount,
        adultCount: data.adultCount,
        childCount: data.childCount,
        petType: data.petType,
        petCount: data.petCount,
        languagesSpoken: data.languagesSpoken,
        profileComplete: true,
      });

      // Save emergency contact to contacts subcollection
      if (data.primaryContactName && (data.primaryContactPhone || data.primaryContactEmail)) {
        const { addContact } = await import('@/services/household.service');
        await addContact(user.uid, {
          name: data.primaryContactName,
          phone: data.primaryContactPhone || '',
          email: data.primaryContactEmail || '',
          isPrimary: true,
          isImAliveContact: true,
        });
      }

      // Save resources to resources collection
      const { addResource } = await import('@/services/resource.service');
      const resourceMap = {
        generator: { name: 'Generator', type: 'power' },
        solarPanel: { name: 'Solar panel / battery pack', type: 'power' },
        vehicle: { name: 'Vehicle (4WD / truck)', type: 'tools' },
        tools: { name: 'Tools (chainsaw, hand tools)', type: 'tools' },
        waterStorage: { name: 'Water storage', type: 'water' },
        firstAidKit: { name: 'First aid kit', type: 'medical' },
        extraSpace: { name: 'Extra space for neighbors', type: 'shelter' },
      };
      for (const [key, info] of Object.entries(resourceMap)) {
        if (data[key]) {
          await addResource({
            name: info.name,
            type: info.type,
            quantity: 1,
            condition: 'good',
            shareable: true,
            location: 'home',
            requiresTraining: false,
            neighborhoodId: '',
          });
        }
      }

      // Save skills to skills collection
      if (data.selectedSkills?.length > 0) {
        const { addSkill } = await import('@/services/skills.service');
        const skillCategoryMap = {
          nurseDoctor: 'medical',
          emt: 'medical',
          cprFirstAid: 'medical',
          firefighter: 'firefighting',
          searchRescue: 'search_rescue',
          hamRadio: 'communications',
          electrician: 'electrical',
          plumber: 'plumbing',
          mechanic: 'mechanical',
          constructionCarpentry: 'construction',
          chainsawTreeRemoval: 'construction',
          mentalHealthCounselor: 'counseling',
          childcare: 'childcare',
          animalCare: 'animalCare',
        };
        for (const skillKey of data.selectedSkills) {
          await addSkill({
            category: skillCategoryMap[skillKey] || 'other',
            level: 'trained',
            skillName: skillKey,
            neighborhoodId: '',
          });
        }
      }

      // Save sensitive data
      if (data.sharingScope !== 'none') {
        await updateSensitiveData(user.uid, {
          sharingScope: data.sharingScope,
          consentTimestamp: new Date().toISOString(),
          consentVersion: '1.0',
          medicalEquipment: data.medicalEquipment || false,
          mobilityLimitation: data.mobilityLimitation || false,
          checkOnMeFirst: data.checkOnMeFirst || false,
        });
      }

      setSaving(false);
      toast.success(t('onboarding.complete'));
      navigate('/', { replace: true });
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  // Can user proceed?
  function canProceed() {
    if (step === 0) return data.firstName.trim().length > 0;
    if (step === 1) return data.address.trim() && data.city.trim() && data.state.trim() && data.zip.trim();
    if (step === 3) return !data.primaryContactName?.trim() || (data.primaryContactPhone?.trim() || data.primaryContactEmail?.trim());
    return true;
  }

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;
  const isLast = step === STEPS.length - 1;
  const progressValue = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <LanguageSwitcher />
      <div className="mx-auto max-w-sm">
        {/* Progress bar */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StepIcon size={16} className="text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-muted-foreground">
                {t(`onboarding.step_${currentStep.key}`)}
              </span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <Progress value={progressValue} />
        </div>

        {/* Step title */}
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t(`onboarding.step_${currentStep.key}`)}
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          {t(`onboarding.step_${currentStep.key}_desc`)}
        </p>

        {/* Step content in a Card */}
        <Card>
          <CardContent className="py-5">
            {step === 0 && <StepName data={data} update={update} />}
            {step === 1 && <StepAddress data={data} update={update} />}
            {step === 2 && <StepBasics data={data} update={update} />}
            {step === 3 && <StepContacts data={data} update={update} />}
            {step === 4 && <StepPets data={data} update={update} />}
            {step === 5 && <StepResources data={data} update={update} />}
            {step === 6 && <StepSkills data={data} update={update} />}
            {step === 7 && <StepLanguages data={data} update={update} />}
            {step === 8 && <StepNeeds data={data} update={update} />}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={handleBack}
            >
              <ChevronLeft size={18} aria-hidden="true" />
              {t('common.back')}
            </Button>
          )}
          <Button
            className="flex-1"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed() || saving || verifying}
          >
            {verifying ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Verifying address...
              </>
            ) : saving ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : isLast ? (
              <>
                <Check size={18} aria-hidden="true" />
                {t('common.done')}
              </>
            ) : (
              <>
                {t('common.next')}
                <ChevronRight size={18} aria-hidden="true" />
              </>
            )}
          </Button>
        </div>

        {/* Skip on optional steps (pets, resources, languages, needs) */}
        {step >= 4 && !isLast && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => setStep(step + 1)}
          >
            {t('common.skip')}
          </Button>
        )}

        {/* Skip on needs (last step) */}
        {isLast && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => {
              update('sharingScope', 'none');
              handleNext();
            }}
          >
            {t('household.sharingDecideLater')}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step Components ────────────────────────────────────────────────

function StepName({ data, update }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="firstName">{t('onboarding.firstName')}</Label>
        <Input
          id="firstName"
          type="text"
          autoComplete="given-name"
          autoFocus
          value={data.firstName}
          onChange={(e) => update('firstName', e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName">{t('onboarding.lastName')}</Label>
        <Input
          id="lastName"
          type="text"
          autoComplete="family-name"
          value={data.lastName}
          onChange={(e) => update('lastName', e.target.value)}
          className="h-11"
        />
      </div>
    </div>
  );
}

function StepAddress({ data, update }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">{t('auth.streetAddress')}</Label>
        <Input
          id="address"
          type="text"
          autoComplete="street-address"
          placeholder={t('auth.addressPlaceholder')}
          value={data.address}
          onChange={(e) => update('address', e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address2">{t('auth.address2')}</Label>
        <Input
          id="address2"
          type="text"
          autoComplete="address-line2"
          placeholder={t('auth.address2Placeholder')}
          value={data.address2 || ''}
          onChange={(e) => update('address2', e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">{t('auth.city')}</Label>
        <Input
          id="city"
          type="text"
          autoComplete="address-level2"
          value={data.city}
          onChange={(e) => update('city', e.target.value)}
          className="h-11"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="state">{t('auth.state')}</Label>
          <Input
            id="state"
            type="text"
            autoComplete="address-level1"
            value={data.state}
            onChange={(e) => update('state', e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">{t('auth.zip')}</Label>
          <Input
            id="zip"
            type="text"
            autoComplete="postal-code"
            inputMode="numeric"
            value={data.zip}
            onChange={(e) => update('zip', e.target.value)}
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}

function StepBasics({ data, update }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="memberCount">{t('household.householdSize')}</Label>
        <Input
          id="memberCount"
          type="number"
          min={1} max={20}
          inputMode="numeric"
          value={data.memberCount}
          onChange={(e) => update('memberCount', parseInt(e.target.value) || 1)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adultCount">{t('household.adults')}</Label>
        <Input
          id="adultCount"
          type="number"
          min={0} max={20}
          inputMode="numeric"
          value={data.adultCount}
          onChange={(e) => update('adultCount', parseInt(e.target.value) || 0)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="childCount">{t('household.children')}</Label>
        <Input
          id="childCount"
          type="number"
          min={0} max={20}
          inputMode="numeric"
          value={data.childCount}
          onChange={(e) => update('childCount', parseInt(e.target.value) || 0)}
          className="h-11"
        />
      </div>
    </div>
  );
}

function StepContacts({ data, update }) {
  const { t } = useTranslation();
  const hasContact = (data.primaryContactPhone || '').trim() || (data.primaryContactEmail || '').trim();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="primaryContactName">{t('household.primaryContactName')}</Label>
        <Input
          id="primaryContactName"
          type="text"
          value={data.primaryContactName || ''}
          onChange={(e) => update('primaryContactName', e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="primaryContactPhone">{t('household.primaryContactPhone')}</Label>
        <Input
          id="primaryContactPhone"
          type="tel"
          inputMode="tel"
          placeholder="828-555-1234"
          value={data.primaryContactPhone || ''}
          onChange={(e) => update('primaryContactPhone', e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="primaryContactEmail">{t('household.primaryContactEmail')}</Label>
        <Input
          id="primaryContactEmail"
          type="email"
          placeholder="name@example.com"
          value={data.primaryContactEmail || ''}
          onChange={(e) => update('primaryContactEmail', e.target.value)}
          className="h-11"
        />
      </div>
      {data.primaryContactName?.trim() && !hasContact && (
        <p className="text-xs text-amber-500">{t('household.contactPhoneOrEmail')}</p>
      )}
    </div>
  );
}

function StepPets({ data, update }) {
  const { t } = useTranslation();
  const pets = data.pets || [];

  // Sync legacy petType/petCount fields after render
  useEffect(() => {
    const totalCount = pets.reduce((s, p) => s + (p.count || 0), 0);
    const typesSummary = pets.map((p) => p.type).filter(Boolean).join(', ');
    if (data.petCount !== totalCount) update('petCount', totalCount);
    if (data.petType !== typesSummary) update('petType', typesSummary);
  }, [pets]);

  function addPet() {
    update('pets', [...pets, { type: '', count: 1 }]);
  }

  function updatePet(index, field, value) {
    const updated = pets.map((p, i) => i === index ? { ...p, [field]: value } : p);
    update('pets', updated);
  }

  function removePet(index) {
    update('pets', pets.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {pets.map((pet, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">{t('household.petTypeLabel')}</Label>
            <Input
              type="text"
              placeholder={t('household.petTypePlaceholder')}
              value={pet.type}
              onChange={(e) => updatePet(i, 'type', e.target.value)}
              className="h-11"
            />
          </div>
          <div className="w-20 space-y-1">
            <Label className="text-xs">#</Label>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={pet.count}
              onChange={(e) => updatePet(i, 'count', parseInt(e.target.value) || 1)}
              className="h-11 text-center"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removePet(i)}
            aria-label={t('common.delete')}
            className="mb-0.5"
          >
            <X size={16} />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        onClick={addPet}
      >
        + {pets.length === 0 ? t('household.addFirstPet', { defaultValue: 'Add a pet' }) : t('household.addPet')}
      </Button>
    </div>
  );
}

function StepResources({ data, update }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('household.resourcesDescription')}
      </p>
      {['generator', 'solarPanel', 'vehicle', 'tools', 'waterStorage', 'firstAidKit', 'extraSpace'].map((key) => (
        <label
          key={key}
          className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50"
        >
          <Checkbox
            checked={data[key] || false}
            onCheckedChange={(checked) => update(key, !!checked)}
          />
          <span className="text-sm">{t(`household.resource_${key}`)}</span>
        </label>
      ))}
    </div>
  );
}

function StepSkills({ data, update }) {
  const { t } = useTranslation();
  const skills = [
    'nurseDoctor',
    'emt',
    'cprFirstAid',
    'firefighter',
    'searchRescue',
    'hamRadio',
    'electrician',
    'plumber',
    'mechanic',
    'constructionCarpentry',
    'chainsawTreeRemoval',
    'mentalHealthCounselor',
    'childcare',
    'animalCare',
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('onboarding.skillsDescription')}
      </p>
      {skills.map((key) => (
        <label
          key={key}
          className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50"
        >
          <Checkbox
            checked={(data.selectedSkills || []).includes(key)}
            onCheckedChange={(checked) => {
              const current = data.selectedSkills || [];
              update('selectedSkills', checked ? [...current, key] : current.filter((s) => s !== key));
            }}
          />
          <span className="text-sm">{t(`onboarding.skill_${key}`)}</span>
        </label>
      ))}
    </div>
  );
}

function StepLanguages({ data, update }) {
  const { t } = useTranslation();
  const languages = ['en', 'es', 'zh', 'vi', 'ko', 'fr', 'ar', 'other'];
  return (
    <div className="space-y-3">
      {languages.map((lang) => (
        <label
          key={lang}
          className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50"
        >
          <Checkbox
            checked={(data.languagesSpoken || []).includes(lang)}
            onCheckedChange={(checked) => {
              const current = data.languagesSpoken || [];
              update('languagesSpoken', checked ? [...current, lang] : current.filter((l) => l !== lang));
            }}
          />
          <span className="text-sm">{t(`languages.${lang}`)}</span>
        </label>
      ))}
    </div>
  );
}

function StepNeeds({ data, update }) {
  const { t } = useTranslation();
  const scopes = [
    { value: 'coordinatorOnly', key: 'sharingCoordinatorOnly' },
    { value: 'coordinatorAndNeighbors', key: 'sharingCoordinatorAndNeighbors' },
    { value: 'none', key: 'sharingNone' },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm">{t('household.needsConsent')}</p>
      </div>
      <RadioGroup value={data.sharingScope} onValueChange={(value) => update('sharingScope', value)}>
        {scopes.map(({ value, key }) => (
          <div
            key={value}
            className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50"
          >
            <RadioGroupItem value={value} id={`scope-${value}`} />
            <Label htmlFor={`scope-${value}`} className="cursor-pointer flex-1">
              {t(`household.${key}`)}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {data.sharingScope !== 'none' && (
        <div className="space-y-3 mt-4">
          {['medicalEquipment', 'mobilityLimitation', 'checkOnMeFirst'].map((key) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={data[key] || false}
                onCheckedChange={(checked) => update(key, !!checked)}
              />
              <span className="text-sm">{t(`household.${key}`)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
