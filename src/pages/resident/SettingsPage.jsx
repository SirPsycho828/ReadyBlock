import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sun, Monitor, Moon, AlertTriangle, Loader2, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { signOutUser, forceSignOut } from '@/services/auth.service';
import { getSensitiveData, updateSensitiveData } from '@/services/household.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const [showSignOutWarning, setShowSignOutWarning] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  async function handleSignOut() {
    const result = await signOutUser();
    if (result.success) {
      navigate('/auth/sign-in', { replace: true });
    } else if (result.error === 'queue-not-empty') {
      setQueueCount(result.data.queueCount);
      setShowSignOutWarning(true);
    }
  }

  async function handleForceSignOut() {
    await forceSignOut();
    navigate('/auth/sign-in', { replace: true });
  }

  return (
    <div className="space-y-6 pt-2 pb-6">
      <h1 className="text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
        {t('nav.settings')}
      </h1>

      {/* Account */}
      <section>
        <SectionLabel>{t('settings.account')}</SectionLabel>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user?.displayName || user?.email}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Badge variant="secondary">{t(`roles.${role || 'unverified'}`)}</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Appearance */}
      <section>
        <SectionLabel>{t('theme.label')}</SectionLabel>
        <Card>
          <CardContent className="py-4">
            <ThemeButtons />
          </CardContent>
        </Card>
      </section>

      {/* Language */}
      <section>
        <SectionLabel>{t('settings.language')}</SectionLabel>
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-2">
              {[
                { code: 'en', label: 'English' },
                { code: 'es', label: 'Espanol' },
              ].map(({ code, label }) => (
                <Button
                  key={code}
                  variant={i18n.language === code ? 'default' : 'outline'}
                  onClick={() => i18n.changeLanguage(code)}
                  className="flex-1"
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Notifications */}
      <section>
        <SectionLabel>{t('settings.notifications')}</SectionLabel>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{t('settings.notificationsDescription')}</p>
          </CardContent>
        </Card>
      </section>

      {/* Privacy */}
      <DataSharingSection />

      {/* Sign Out */}
      <Button
        variant="destructive"
        className="w-full"
        size="lg"
        onClick={handleSignOut}
      >
        <LogOut size={18} aria-hidden="true" />
        {t('auth.signOut')}
      </Button>

      {/* Sign-out warning dialog */}
      <Dialog open={showSignOutWarning} onOpenChange={setShowSignOutWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" aria-hidden="true" />
              {t('queue.warningTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('queue.signOutWarning', { count: queueCount })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSignOutWarning(false)}>
              {t('queue.staySignedIn')}
            </Button>
            <Button variant="outline" onClick={handleForceSignOut}>
              {t('queue.signOutAnyway')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Section Label ─────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
      {children}
    </p>
  );
}

// ─── Theme Buttons ─────────────────────────────────────────────────

function ThemeButtons() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light', icon: Sun, label: t('theme.light') },
    { value: 'system', icon: Monitor, label: t('theme.system') },
    { value: 'dark', icon: Moon, label: t('theme.dark') },
  ];

  return (
    <div className="flex gap-2" role="radiogroup" aria-label={t('theme.label')}>
      {options.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          role="radio"
          aria-checked={theme === value}
          variant={theme === value ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setTheme(value)}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </Button>
      ))}
    </div>
  );
}

// ─── Data Sharing Section ──────────────────────────────────────────

function DataSharingSection() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [scope, setScope] = useState(null);
  const [medicalEquipment, setMedicalEquipment] = useState(false);
  const [mobilityLimitation, setMobilityLimitation] = useState(false);
  const [checkOnMeFirst, setCheckOnMeFirst] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getSensitiveData(user.uid).then((res) => {
      if (res.success && res.data) {
        setScope(res.data.sharingScope || 'none');
        setMedicalEquipment(res.data.medicalEquipment || false);
        setMobilityLimitation(res.data.mobilityLimitation || false);
        setCheckOnMeFirst(res.data.checkOnMeFirst || false);
      } else {
        setScope('none');
      }
      setLoading(false);
    });
  }, [user?.uid]);

  function updateScope(newScope) {
    setScope(newScope);
    setDirty(true);
    if (newScope === 'none') {
      setMedicalEquipment(false);
      setMobilityLimitation(false);
      setCheckOnMeFirst(false);
    }
  }

  function updateCheckbox(setter) {
    return (checked) => {
      setter(!!checked);
      setDirty(true);
    };
  }

  async function handleSave() {
    setSaving(true);
    await updateSensitiveData(user.uid, {
      sharingScope: scope,
      medicalEquipment,
      mobilityLimitation,
      checkOnMeFirst,
      consentTimestamp: new Date().toISOString(),
      consentVersion: '1.0',
    });
    setSaving(false);
    setDirty(false);
    toast.success(t('settings.privacySaved'));
  }

  const scopes = [
    { value: 'coordinatorOnly', key: 'sharingCoordinatorOnly' },
    { value: 'coordinatorAndNeighbors', key: 'sharingCoordinatorAndNeighbors' },
    { value: 'none', key: 'sharingNone' },
  ];

  return (
    <section>
      <SectionLabel>{t('settings.privacy')}</SectionLabel>
      <Card>
        <CardContent className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('settings.privacyDescription')}
          </p>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <RadioGroup value={scope} onValueChange={updateScope}>
                {scopes.map(({ value, key }) => (
                  <div
                    key={value}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      scope === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border',
                    )}
                    onClick={() => updateScope(value)}
                  >
                    <RadioGroupItem value={value} id={`privacy-${value}`} />
                    <Label htmlFor={`privacy-${value}`} className="cursor-pointer flex-1">
                      {t(`household.${key}`)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {scope !== 'none' && (
                <div className="space-y-3 pt-2">
                  {[
                    { key: 'medicalEquipment', checked: medicalEquipment, setter: setMedicalEquipment },
                    { key: 'mobilityLimitation', checked: mobilityLimitation, setter: setMobilityLimitation },
                    { key: 'checkOnMeFirst', checked: checkOnMeFirst, setter: setCheckOnMeFirst },
                  ].map(({ key, checked, setter }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={updateCheckbox(setter)}
                      />
                      <span className="text-sm">{t(`household.${key}`)}</span>
                    </label>
                  ))}
                </div>
              )}

              {dirty && (
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {t('settings.savePrivacy')}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
