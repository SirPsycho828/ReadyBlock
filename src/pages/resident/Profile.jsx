import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Home, Phone, Package, Award, Plus, Trash2, Loader2, Save, Pencil, Mail,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getHousehold, getContacts, addContact, updateContact, deleteContact } from '@/services/household.service';
import { getHouseholdResources, addResource, updateResource, deleteResource, RESOURCE_TYPES } from '@/services/resource.service';
import { getUserSkills, addSkill, SKILL_CATEGORIES, SKILL_LEVELS } from '@/services/skills.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [household, setHousehold] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [resources, setResources] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      getHousehold(user.uid).then((r) => r.success && setHousehold(r.data)),
      getContacts(user.uid).then((r) => r.success && setContacts(r.data)),
      getHouseholdResources(user.uid).then((r) => r.success && setResources(r.data)),
      getUserSkills(user.uid).then((r) => r.success && setSkills(r.data?.filter((s) => !s.withdrawnAt) || [])),
    ]).finally(() => setLoading(false));
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
          {t('nav.profile')}
        </h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/onboarding')}>
          {t('common.edit')}
        </Button>
      </div>

      {/* Household Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home size={18} className="text-primary" aria-hidden="true" />
            {t('household.basics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {household ? (
            <div className="space-y-0">
              <InfoRow label={t('profile.name')} value={user?.displayName || t('profile.notSet')} />
              <Separator />
              <InfoRow label={t('profile.address')} value={household.address || t('profile.notSet')} />
              <Separator />
              <InfoRow
                label={t('profile.members')}
                value={`${household.adultCount || 0} ${t('profile.adults')}, ${household.childCount || 0} ${t('profile.children')}`}
              />
              {household.petType && (
                <>
                  <Separator />
                  <InfoRow label={t('household.pets')} value={`${household.petCount || 0} ${household.petType}`} />
                </>
              )}
              {household.languagesSpoken?.length > 0 && (
                <>
                  <Separator />
                  <InfoRow
                    label={t('household.languages')}
                    value={household.languagesSpoken.map((l) => t(`languages.${l}`)).join(', ')}
                  />
                </>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => navigate('/onboarding')}
            >
              <Plus size={16} aria-hidden="true" />
              {t('profile.addHousehold')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <ContactsSection
        contacts={contacts}
        onAdd={(c) => setContacts((prev) => [...prev, c])}
        onDelete={(id) => setContacts((prev) => prev.filter((c) => c.id !== id))}
        onUpdate={(updated) => setContacts((prev) => prev.map((c) => c.id === updated.id ? updated : c))}
      />

      {/* Resources */}
      <ResourcesSection
        resources={resources}
        onAdd={(r) => setResources((prev) => [...prev, r])}
        onDelete={(id) => setResources((prev) => prev.filter((r) => r.id !== id))}
        onUpdate={(updated) => setResources((prev) => prev.map((r) => r.id === updated.id ? updated : r))}
      />

      {/* Skills */}
      <SkillsSection
        skills={skills}
        onAdd={(s) => setSkills((prev) => [...prev, s])}
      />
    </div>
  );
}

// ─── Info Row ──────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ─── Contacts Section ──────────────────────────────────────────────

function ContactsSection({ contacts, onAdd, onDelete, onUpdate }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditingContact(null);
    setName('');
    setPhone('');
    setEmail('');
    setDialogOpen(true);
  }

  function openEdit(contact) {
    setEditingContact(contact);
    setName(contact.name || '');
    setPhone(contact.phone || '');
    setEmail(contact.email || '');
    setDialogOpen(true);
  }

  const canSave = name.trim() && (phone.trim() || email.trim());

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);

    if (editingContact) {
      const result = await updateContact(user.uid, editingContact.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      setSaving(false);
      if (result.success) {
        onUpdate({ ...editingContact, name: name.trim(), phone: phone.trim(), email: email.trim() });
        setDialogOpen(false);
        toast.success(t('profile.contactUpdated'));
      }
    } else {
      const result = await addContact(user.uid, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        isPrimary: contacts.length === 0,
        isImAliveContact: true,
      });
      setSaving(false);
      if (result.success) {
        onAdd(result.data);
        setDialogOpen(false);
        toast.success(t('profile.contactAdded'));
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone size={18} className="text-primary" aria-hidden="true" />
          {t('household.contacts')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.length > 0 && (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
                  {c.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail size={12} aria-hidden="true" />
                      {c.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(c)}
                    aria-label={t('profile.editContact')}
                  >
                    <Pencil size={14} className="text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      await deleteContact(user.uid, c.id);
                      onDelete(c.id);
                      toast.success(t('profile.contactRemoved'));
                    }}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button variant="outline" className="w-full border-dashed" onClick={openAdd}>
            <Plus size={16} aria-hidden="true" />
            {t('profile.addContact')}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingContact ? t('profile.editContact') : t('profile.addContact')}
              </DialogTitle>
              <DialogDescription>{t('household.contactsDescription')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">{t('household.primaryContactName')}</Label>
                <Input
                  id="contact-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">{t('household.primaryContactPhone')}</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="828-555-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">{t('household.primaryContactEmail')}</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              {!phone.trim() && !email.trim() && name.trim() && (
                <p className="text-xs text-amber-500">{t('household.contactPhoneOrEmail')}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving || !canSave}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ─── Resources Section ─────────────────────────────────────────────

function ResourcesSection({ resources, onAdd, onDelete, onUpdate }) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('tools');
  const [details, setDetails] = useState('');
  const [shareable, setShareable] = useState(true);
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditingResource(null);
    setName('');
    setType('tools');
    setDetails('');
    setShareable(true);
    setDialogOpen(true);
  }

  function openEdit(resource) {
    setEditingResource(resource);
    setName(resource.name || '');
    setType(resource.type || 'tools');
    setDetails(resource.details || '');
    setShareable(resource.shareable !== false);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!name) return;
    setSaving(true);

    if (editingResource) {
      const updates = { name: name.trim(), type, details: details.trim(), shareable };
      const result = await updateResource(editingResource.id, updates);
      setSaving(false);
      if (result.success) {
        onUpdate({ ...editingResource, ...updates });
        setDialogOpen(false);
        toast.success(t('profile.resourceUpdated'));
      }
    } else {
      const result = await addResource({
        name: name.trim(),
        type,
        details: details.trim(),
        quantity: 1,
        condition: 'good',
        shareable,
        location: 'home',
        requiresTraining: false,
      });
      setSaving(false);
      if (result.success) {
        onAdd(result.data);
        setName('');
        setType('tools');
        setDetails('');
        setDialogOpen(false);
        toast.success(t('profile.resourceAdded'));
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package size={18} className="text-primary" aria-hidden="true" />
          {t('household.resources')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {resources.length > 0 && (
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.name}</p>
                  {r.details && <p className="text-xs text-muted-foreground">{r.details}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {t(`resource.type.${r.type}`)}
                    </Badge>
                    <Badge variant={r.shareable ? 'default' : 'outline'} className="text-xs">
                      {r.shareable ? t('profile.shareable') : t('profile.personalOnly')}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(r)}
                    aria-label={t('profile.editResource')}
                  >
                    <Pencil size={14} className="text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      const result = await deleteResource(r.id);
                      if (result.success) {
                        onDelete(r.id);
                        toast.success(t('profile.resourceRemoved'));
                      }
                    }}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button variant="outline" className="w-full border-dashed" onClick={openAdd}>
            <Plus size={16} aria-hidden="true" />
            {t('profile.addResource')}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingResource ? t('profile.editResource') : t('profile.addResource')}
              </DialogTitle>
              <DialogDescription>{t('household.resources')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="resource-name">{t('profile.resourceName')}</Label>
                <Input
                  id="resource-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('profile.resourceNamePlaceholder')}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('profile.resourceType')}</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((rt) => (
                      <SelectItem key={rt} value={rt}>{t(`resource.type.${rt}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-details">{t('profile.resourceDetails')}</Label>
                <Input
                  id="resource-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('profile.resourceDetailsPlaceholder')}
                  className="h-11"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="shareable"
                  checked={shareable}
                  onCheckedChange={(checked) => setShareable(!!checked)}
                />
                <Label htmlFor="shareable">{t('profile.shareableLabel')}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving || !name}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ─── Skills Section ────────────────────────────────────────────────

function SkillsSection({ skills, onAdd }) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState('medical');
  const [level, setLevel] = useState('basic');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await addSkill({ category, level, neighborhoodId: '' });
    setSaving(false);
    if (result.success) {
      onAdd(result.data);
      setCategory('medical');
      setLevel('basic');
      setDialogOpen(false);
      toast.success(t('profile.skillAdded'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award size={18} className="text-primary" aria-hidden="true" />
          {t('profile.skills')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {skills.length > 0 && (
          <div className="space-y-2">
            {skills.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{t(`skill.category.${s.category}`)}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {t(`skill.level.${s.level}`)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed">
              <Plus size={16} aria-hidden="true" />
              {t('profile.addSkill')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('profile.addSkill')}</DialogTitle>
              <DialogDescription>{t('profile.skills')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t('profile.skillCategory')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{t(`skill.category.${c}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('profile.skillLevel')}</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>{t(`skill.level.${l}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
