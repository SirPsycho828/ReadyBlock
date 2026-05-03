import { useDemoRoleStore } from '@/stores/demoRoleStore';
import { useAuthStore } from '@/stores/authStore';

export function useEffectiveRole() {
  const demoRole = useDemoRoleStore((s) => s.demoRole);
  const realRole = useAuthStore((s) => s.role);
  return demoRole ?? realRole;
}
