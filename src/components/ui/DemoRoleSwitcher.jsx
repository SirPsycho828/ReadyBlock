import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Building2, X, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { useDemoRoleStore } from '@/stores/demoRoleStore';
import { useAuthStore } from '@/stores/authStore';
import { useNeighborhoodStore } from '@/stores/neighborhoodStore';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { MOCK_NEIGHBORHOODS, MOCK_HOUSEHOLDS } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const DEMO_ROLES = [
  {
    key: 'householdMember',
    label: 'Resident',
    icon: User,
    home: '/',
    toastLabel: 'Resident',
  },
  {
    key: 'neighborhoodCaptain',
    label: 'Captain',
    icon: Shield,
    home: '/coordinator/dashboard',
    toastLabel: 'Neighborhood Captain',
  },
  {
    key: 'cityCountyCaptain',
    label: 'Municipal',
    icon: Building2,
    home: '/admin',
    toastLabel: 'Municipal Disaster Employee',
  },
];

export function DemoRoleSwitcher() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const effectiveRole = useEffectiveRole();
  const user = useAuthStore((s) => s.user);
  const setDemoRole = useDemoRoleStore((s) => s.setDemoRole);

  if (user?.email !== import.meta.env.VITE_ADMIN_EMAIL) return null;

  function handleSwitch(role) {
    if (role.key === effectiveRole) return;

    setDemoRole(role.key);

    // Seed neighborhood data for captain role
    if (role.key === 'neighborhoodCaptain') {
      const store = useNeighborhoodStore.getState();
      store.setNeighborhood(MOCK_NEIGHBORHOODS[0]);
      store.setHouseholds(MOCK_HOUSEHOLDS);
    }

    navigate(role.home);
    toast(`Demo: ${role.toastLabel} view`);
  }

  // Collapsed state — minimal re-open button
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-110"
        aria-label="Show demo role switcher"
      >
        <FlaskConical size={18} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-1 rounded-2xl border border-indigo-200 bg-white/95 p-1 shadow-xl backdrop-blur-md">
      {/* DEMO badge */}
      <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
        Demo
      </span>

      {/* Role segments */}
      {DEMO_ROLES.map((role) => {
        const Icon = role.icon;
        const isActive = effectiveRole === role.key;
        return (
          <button
            key={role.key}
            onClick={() => handleSwitch(role)}
            className={cn(
              'flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all',
              isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600'
            )}
          >
            <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="hidden sm:inline">{role.label}</span>
          </button>
        );
      })}

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(true)}
        className="ml-0.5 rounded-lg p-1 text-indigo-300 transition-colors hover:bg-indigo-50 hover:text-indigo-500"
        aria-label="Hide demo role switcher"
      >
        <X size={14} />
      </button>
    </div>
  );
}
