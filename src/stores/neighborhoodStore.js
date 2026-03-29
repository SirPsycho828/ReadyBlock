import { create } from 'zustand';

export const useNeighborhoodStore = create((set) => ({
  neighborhood: null,
  households: [],
  emergencyMode: false,
  emergencyEventName: null,

  setNeighborhood: (neighborhood) => set({ neighborhood }),
  setHouseholds: (households) => set({ households }),

  setEmergencyMode: (active, eventName = null) =>
    set({
      emergencyMode: active,
      emergencyEventName: eventName,
    }),

  reset: () =>
    set({
      neighborhood: null,
      households: [],
      emergencyMode: false,
      emergencyEventName: null,
    }),
}));
