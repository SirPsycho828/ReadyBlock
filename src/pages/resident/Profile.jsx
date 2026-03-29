import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  User, Home, Phone, PawPrint, Package, Globe, ShieldAlert,
  ChevronRight, Edit3, Plus, Trash2, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getHousehold, getContacts, deleteContact } from '@/services/household.service';
import { getHouseholdResources } from '@/services/resource.service';
import { getUserSkills } from '@/services/skills.service';
import { toast } from 'sonner';

export default function Profile() {
  const { t } = useTranslation();
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
        <Loader2 size={28} className="animate-spin text-[var(--color-brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl text-[var(--color-text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('nav.profile')}
        </h1>
        <Link
          to="/onboarding"
          className="flex items-center gap-1 text-sm font-medium text-[var(--color-brand-primary)]"
          style={{ minHeight: 44 }}
        >
          <Edit3 size={16} aria-hidden="true" />
          {t('common.edit')}
        </Link>
      </div>

      {/* Household info */}
      <ProfileSection icon={Home} title={t('household.basics')}>
        {household ? (
          <div className="space-y-2 text-sm">
            <InfoRow label={t('profile.address')} value={household.address || t('profile.notSet')} />
            <InfoRow label={t('profile.members')} value={`${household.adultCount || 0} ${t('profile.adults')}, ${household.childCount || 0} ${t('profile.children')}`} />
            {household.petType && (
              <InfoRow label={t('household.pets')} value={`${household.petCount || 0} ${household.petType}`} />
            )}
            {household.languagesSpoken?.length > 0 && (
              <InfoRow label={t('household.languages')} value={household.languagesSpoken.map((l) => t(`languages.${l}`)).join(', ')} />
            )}
          </div>
        ) : (
          <EmptyAction label={t('profile.addHousehold')} to="/onboarding" />
        )}
      </ProfileSection>

      {/* Emergency contacts */}
      <ProfileSection icon={Phone} title={t('household.contacts')}>
        {contacts.length > 0 ? (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{c.name}</p>
                  <p className="text-[var(--color-text-secondary)]">{c.phone}</p>
                </div>
                <button
                  onClick={async () => {
                    await deleteContact(user.uid, c.id);
                    setContacts((prev) => prev.filter((x) => x.id !== c.id));
                    toast.success(t('profile.contactRemoved'));
                  }}
                  className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-status-alert)]"
                  style={{ minWidth: 44, minHeight: 44 }}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyAction label={t('profile.addContact')} to="/onboarding" />
        )}
      </ProfileSection>

      {/* Resources */}
      <ProfileSection icon={Package} title={t('household.resources')}>
        {resources.length > 0 ? (
          <div className="space-y-2">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{r.name}</p>
                  <p className="text-[var(--color-text-secondary)]">{t(`resource.type.${r.type}`)} &middot; {r.shareable ? t('profile.shareable') : t('profile.personalOnly')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyAction label={t('profile.addResource')} to="/onboarding" />
        )}
      </ProfileSection>

      {/* Skills */}
      <ProfileSection icon={ShieldAlert} title={t('profile.skills')}>
        {skills.length > 0 ? (
          <div className="space-y-2">
            {skills.map((s) => (
              <div key={s.id} className="text-sm">
                <p className="font-medium text-[var(--color-text-primary)]">{t(`skill.category.${s.category}`)}</p>
                <p className="text-[var(--color-text-secondary)]">{t(`skill.level.${s.level}`)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyAction label={t('profile.addSkill')} to="/onboarding" />
        )}
      </ProfileSection>
    </div>
  );
}

function ProfileSection({ icon: Icon, title, children }) {
  return (
    <div
      className="rounded-xl bg-[var(--color-surface-primary)] p-4 shadow-sm"
      style={{ borderRadius: 'var(--radius-community)' }}
    >
      <h2 className="font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
        <Icon size={18} className="text-[var(--color-brand-primary)]" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-[var(--color-text-primary)] font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function EmptyAction({ label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-[var(--color-brand-primary)] rounded-lg border border-dashed border-[var(--color-border-default)] hover:bg-[var(--color-surface-secondary)] transition-colors"
      style={{ minHeight: 48 }}
    >
      <Plus size={16} aria-hidden="true" />
      {label}
    </Link>
  );
}
