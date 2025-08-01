import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { TimerState } from '../reducers/timerReducer';
import { storage } from '../storage';

interface TimerStoreState {
  // Timer state
  running: boolean;
  start: string | null;
  lastEntryId: number | null;
  lastProjectId: number | null;
  
  // Actions
  startTimer: (entryId: number, projectId: number, startTime?: string) => void;
  stopTimer: () => void;
  updateProjectId: (projectId: number) => void;
  setTimer: (timer: TimerState) => void;
  
  // Computed
  getElapsedMs: () => number;
}

// Custom storage adapter for our async KV store
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await storage.get<string>(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await storage.set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await storage.remove(name);
  },
};

export const useTimerStore = create<TimerStoreState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      running: false,
      start: null,
      lastEntryId: null,
      lastProjectId: null,

      startTimer: (entryId, projectId, startTime) =>
        set((state) => {
          state.running = true;
          state.start = startTime || new Date().toISOString();
          state.lastEntryId = entryId;
          state.lastProjectId = projectId;
        }),

      stopTimer: () =>
        set((state) => {
          state.running = false;
          state.start = null;
        }),

      updateProjectId: (projectId) =>
        set((state) => {
          state.lastProjectId = projectId;
        }),

      setTimer: (timer) =>
        set((state) => {
          state.running = timer.running;
          state.start = timer.start;
          state.lastEntryId = timer.lastEntryId;
          state.lastProjectId = timer.lastProjectId;
        }),

      getElapsedMs: () => {
        const state = get();
        if (!state.running || !state.start) return 0;
        
        const now = new Date();
        const startTime = new Date(state.start);
        return Math.max(0, now.getTime() - startTime.getTime());
      },
    })),
    {
      name: 'timetracker.moe.timer',
      storage: createJSONStorage(() => customStorage),
    }
  )
); 