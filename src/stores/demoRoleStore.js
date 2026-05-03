import { create } from 'zustand';

const STORAGE_KEY = 'readyblock-demo-role';
const VALID_ROLES = ['householdMember', 'neighborhoodCaptain', 'cityCountyCaptain'];

function getPersistedRole() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (VALID_ROLES.includes(stored)) return stored;
  } catch { /* SSR or blocked storage */ }
  return null;
}

export const useDemoRoleStore = create((set) => ({
  demoRole: getPersistedRole(),

  setDemoRole: (role) => {
    try { localStorage.setItem(STORAGE_KEY, role); } catch { /* ignore */ }
    set({ demoRole: role });
  },

  clearDemoRole: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    set({ demoRole: null });
  },
}));
