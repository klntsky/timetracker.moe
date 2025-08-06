import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { TimeEntry } from '../types';
import { storage } from '../storage';

interface EntriesState {
  entries: TimeEntry[];

  // Actions
  addEntry: (entry: TimeEntry) => void;
  updateEntry: (id: number, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, projectId: number) => void;
  updateEntryDuration: (id: number, additionalMs: number) => void;
  setEntries: (entries: TimeEntry[]) => void;
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

export const useEntriesStore = create<EntriesState>()(
  persist(
    immer((set) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          state.entries.push(entry);
        }),

      updateEntry: (id, updates) =>
        set((state) => {
          const index = state.entries.findIndex((e: TimeEntry) => e.id === id);
          if (index !== -1) {
            Object.assign(state.entries[index], updates);
          }
        }),

      deleteEntry: (id) =>
        set((state) => {
          const index = state.entries.findIndex((e: TimeEntry) => e.id === id);
          if (index !== -1) {
            state.entries.splice(index, 1);
          }
        }),

      changeEntryProject: (id, projectId) =>
        set((state) => {
          const index = state.entries.findIndex((e: TimeEntry) => e.id === id);
          if (index !== -1) {
            state.entries[index].projectId = projectId;
          }
        }),

      updateEntryDuration: (id, additionalMs) =>
        set((state) => {
          const index = state.entries.findIndex((e: TimeEntry) => e.id === id);
          if (index !== -1) {
            state.entries[index].duration += additionalMs;
          }
        }),

      setEntries: (entries) =>
        set((state) => {
          state.entries = entries;
        }),
    })),
    {
      name: 'timetracker.moe.entries',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
