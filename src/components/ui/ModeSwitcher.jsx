import { Sun, CloudLightning, Sunrise } from 'lucide-react';
import { useAppModeStore } from '@/stores/appModeStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const MODES = [
  { key: 'bluesky', label: 'Blue Sky', icon: Sun, activeClass: 'bg-teal-100 text-teal-700' },
  { key: 'storm', label: 'Storm', icon: CloudLightning, activeClass: 'bg-coral-50 text-coral-600' },
  { key: 'recovery', label: 'Recovery', icon: Sunrise, activeClass: 'bg-amber-100 text-amber-700' },
];

export function ModeSwitcher() {
  const mode = useAppModeStore((s) => s.mode);
  const setMode = useAppModeStore((s) => s.setMode);
  const user = useAuthStore((s) => s.user);

  if (user?.email !== import.meta.env.VITE_ADMIN_EMAIL) return null;

  return (
    <div
      role="radiogroup"
      aria-label="App mode"
      className="flex w-full rounded-xl border border-border bg-muted/50 p-1 gap-1"
    >
      {MODES.map(({ key, label, icon: Icon, activeClass }) => {
        const isActive = mode === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={isActive}
            onClick={() => setMode(key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all',
              isActive
                ? activeClass
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} aria-hidden="true" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
