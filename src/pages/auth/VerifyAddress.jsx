import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function VerifyAddress() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!address || !city || !state || !zip) return;

    if (!user?.uid) {
      toast.error(t('auth.errors.networkUnavailable'));
      console.error('VerifyAddress: user not loaded yet', user);
      return;
    }

    setLoading(true);
    try {
      const fullAddress = `${address}, ${city}, ${state} ${zip}`;

      // Create user doc (skip if already exists)
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || '',
          language: 'en',
          darkMode: 'system',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } catch (userErr) {
        // Doc may already exist — that's fine, Cloud Function handles it
        console.log('User doc write skipped:', userErr.code);
      }

      // Create household document — Cloud Function will geocode and assign neighborhood
      try {
        await setDoc(doc(db, 'households', user.uid), {
          address: fullAddress,
          name: user.displayName || user.email?.split('@')[0] || '',
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
      } catch (hhErr) {
        // If household already exists, update just the address
        if (hhErr.code === 'permission-denied') {
          const { updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'households', user.uid), {
            address: fullAddress,
            lastModified: serverTimestamp(),
            lastModifiedBy: user.uid,
          });
        } else {
          throw hhErr;
        }
      }

      navigate('/auth/pending', { replace: true });
    } catch (err) {
      console.error('VerifyAddress error:', err.code, err.message);
      toast.error(t('common.error'));
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-app)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-secondary)]">
            <MapPin size={32} className="text-[var(--color-brand-primary)]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
            {t('auth.verifyAddress')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('auth.verifyAddressDescription')}
          </p>
        </div>

        <div className="rounded-xl bg-[var(--color-surface-primary)] p-6 shadow-sm" style={{ borderRadius: 'var(--radius-community)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                {t('auth.streetAddress')}
              </label>
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('auth.addressPlaceholder')}
                className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
                style={{ minHeight: 44, fontSize: 16 }}
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                {t('auth.city')}
              </label>
              <input
                id="city"
                type="text"
                autoComplete="address-level2"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
                style={{ minHeight: 44, fontSize: 16 }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {t('auth.state')}
                </label>
                <input
                  id="state"
                  type="text"
                  autoComplete="address-level1"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
                  style={{ minHeight: 44, fontSize: 16 }}
                />
              </div>
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  {t('auth.zip')}
                </label>
                <input
                  id="zip"
                  type="text"
                  autoComplete="postal-code"
                  required
                  inputMode="numeric"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] px-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2"
                  style={{ minHeight: 44, fontSize: 16 }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--color-brand-primary)] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ minHeight: 48, fontSize: 16 }}
            >
              {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              {t('auth.verifyAddress')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
