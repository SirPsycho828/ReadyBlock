import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Users, Phone, PawPrint, Package, Globe, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { updateHousehold, updateSensitiveData } from '@/services/household.service';
import { toast } from 'sonner';

const STEPS = [
  { key: 'basics', icon: Users },
  { key: 'contacts', icon: Phone },
  { key: 'pets', icon: PawPrint },
  { key: 'resources', icon: Package },
  { key: 'languages', icon: Globe },
  { key: 'needs', icon: ShieldAlert },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    memberCount: 1,
    adultCount: 1,
    childCount: 0,
    petType: '',
    petCount: 0,
    languagesSpoken: ['en'],
    sharingScope: 'none',
  });

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  async function handleNext() {
    if (step < STEPS.length - 1) {
      // Save incrementally
      await updateHousehold(user.uid, data);
      setStep(step + 1);
    } else {
      // Final step — save everything including sensitive data
      await updateHousehold(user.uid, {
        ...data,
        profileComplete: true,
      });

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

      toast.success(t('common.done'));
      navigate('/', { replace: true });
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[var(--color-surface-app)] px-4 py-6">
      <div className="mx-auto max-w-sm">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-surface-secondary)]">
            <div
              className="h-2 rounded-full bg-[var(--color-brand-secondary)] transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%`, transitionDuration: 'var(--duration-base)' }}
            />
          </div>
        </div>

        {/* Step title */}
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          {t(`household.${currentStep.key}`)}
        </h1>

        {/* Step content */}
        <div className="rounded-xl bg-[var(--color-surface-primary)] p-5 shadow-sm mt-4" style={{ borderRadius: 'var(--radius-community)' }}>
          {step === 0 && <StepBasics data={data} update={update} />}
          {step === 1 && <StepContacts data={data} update={update} />}
          {step === 2 && <StepPets data={data} update={update} />}
          {step === 3 && <StepResources data={data} update={update} />}
          {step === 4 && <StepLanguages data={data} update={update} />}
          {step === 5 && <StepNeeds data={data} update={update} />}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] font-medium"
              style={{ minHeight: 48 }}
            >
              <ChevronLeft size={18} aria-hidden="true" />
              {t('common.back')}
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-[var(--color-brand-primary)] text-white font-medium"
            style={{ minHeight: 48 }}
          >
            {isLast ? (
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
          </button>
        </div>

        {/* Skip option on needs step */}
        {step === 5 && (
          <button
            onClick={() => {
              update('sharingScope', 'none');
              handleNext();
            }}
            className="w-full mt-3 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            style={{ minHeight: 44 }}
          >
            {t('household.sharingDecideLater')}
          </button>
        )}
      </div>
    </div>
  );
}

function InputField({ label, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
        style={{ minHeight: 44, fontSize: 16 }}
        {...props}
      />
    </div>
  );
}

function StepBasics({ data, update }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <InputField
        label={t('household.householdSize')}
        id="memberCount"
        type="number"
        min={1}
        max={20}
        inputMode="numeric"
        value={data.memberCount}
        onChange={(e) => update('memberCount', parseInt(e.target.value) || 1)}
      />
      <InputField
        label={t('household.adults')}
        id="adultCount"
        type="number"
        min={0}
        max={20}
        inputMode="numeric"
        value={data.adultCount}
        onChange={(e) => update('adultCount', parseInt(e.target.value) || 0)}
      />
      <InputField
        label={t('household.children')}
        id="childCount"
        type="number"
        min={0}
        max={20}
        inputMode="numeric"
        value={data.childCount}
        onChange={(e) => update('childCount', parseInt(e.target.value) || 0)}
      />
    </div>
  );
}

function StepContacts({ data, update }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        {t('household.contactsDescription')}
      </p>
      <InputField
        label={t('household.primaryContactName')}
        id="primaryContactName"
        type="text"
        value={data.primaryContactName || ''}
        onChange={(e) => update('primaryContactName', e.target.value)}
      />
      <InputField
        label={t('household.primaryContactPhone')}
        id="primaryContactPhone"
        type="tel"
        inputMode="tel"
        value={data.primaryContactPhone || ''}
        onChange={(e) => update('primaryContactPhone', e.target.value)}
      />
    </div>
  );
}

function StepPets({ data, update }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <InputField
        label={t('household.petType')}
        id="petType"
        type="text"
        placeholder={t('household.petTypePlaceholder')}
        value={data.petType}
        onChange={(e) => update('petType', e.target.value)}
      />
      <InputField
        label={t('household.petCount')}
        id="petCount"
        type="number"
        min={0}
        inputMode="numeric"
        value={data.petCount}
        onChange={(e) => update('petCount', parseInt(e.target.value) || 0)}
      />
    </div>
  );
}

function StepResources({ data, update }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-text-secondary)]">
        {t('household.resourcesDescription')}
      </p>
      {['generator', 'vehicle', 'tools', 'extraSpace'].map((key) => (
        <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] cursor-pointer" style={{ minHeight: 44 }}>
          <input
            type="checkbox"
            checked={data[key] || false}
            onChange={(e) => update(key, e.target.checked)}
            className="h-5 w-5 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)]"
          />
          <span className="text-[var(--color-text-primary)]">{t(`household.resource_${key}`)}</span>
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
      <p className="text-sm text-[var(--color-text-secondary)]">
        {t('household.languagesDescription')}
      </p>
      {languages.map((lang) => (
        <label key={lang} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] cursor-pointer" style={{ minHeight: 44 }}>
          <input
            type="checkbox"
            checked={(data.languagesSpoken || []).includes(lang)}
            onChange={(e) => {
              const current = data.languagesSpoken || [];
              update(
                'languagesSpoken',
                e.target.checked ? [...current, lang] : current.filter((l) => l !== lang),
              );
            }}
            className="h-5 w-5 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)]"
          />
          <span className="text-[var(--color-text-primary)]">{t(`languages.${lang}`)}</span>
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
      <div className="rounded-lg bg-[var(--color-surface-secondary)] p-4">
        <p className="text-sm text-[var(--color-text-primary)]">
          {t('household.needsConsent')}
        </p>
      </div>

      <div className="space-y-2">
        {scopes.map(({ value, key }) => (
          <label key={value} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] cursor-pointer" style={{ minHeight: 44 }}>
            <input
              type="radio"
              name="sharingScope"
              value={value}
              checked={data.sharingScope === value}
              onChange={() => update('sharingScope', value)}
              className="h-5 w-5 border-[var(--color-border-default)] text-[var(--color-brand-primary)]"
            />
            <span className="text-[var(--color-text-primary)]">{t(`household.${key}`)}</span>
          </label>
        ))}
      </div>

      {data.sharingScope !== 'none' && (
        <div className="space-y-3 mt-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] cursor-pointer" style={{ minHeight: 44 }}>
            <input
              type="checkbox"
              checked={data.medicalEquipment || false}
              onChange={(e) => update('medicalEquipment', e.target.checked)}
              className="h-5 w-5 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)]"
            />
            <span className="text-[var(--color-text-primary)]">{t('household.medicalEquipment')}</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] cursor-pointer" style={{ minHeight: 44 }}>
            <input
              type="checkbox"
              checked={data.mobilityLimitation || false}
              onChange={(e) => update('mobilityLimitation', e.target.checked)}
              className="h-5 w-5 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)]"
            />
            <span className="text-[var(--color-text-primary)]">{t('household.mobilityLimitation')}</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border-default)] cursor-pointer" style={{ minHeight: 44 }}>
            <input
              type="checkbox"
              checked={data.checkOnMeFirst || false}
              onChange={(e) => update('checkOnMeFirst', e.target.checked)}
              className="h-5 w-5 rounded border-[var(--color-border-default)] text-[var(--color-brand-primary)]"
            />
            <span className="text-[var(--color-text-primary)]">{t('household.checkOnMeFirst')}</span>
          </label>
        </div>
      )}
    </div>
  );
}
