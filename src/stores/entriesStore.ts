import { useSyncExternalStore } from 'react';
import { TimeEntry } from '../types';
import { storage } from '../storage';

interface EntriesState {
  entries: TimeEntry[];
  addEntry: (entry: TimeEntry) => void;
  updateEntry: (id: number, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, projectId: number) => void;
  updateEntryDuration: (id: number, additionalMs: number) => void;
  setEntries: (entries: TimeEntry[]) => void;
}

const STORAGE_KEY = 'timetracker.moe.entries';

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch (err) {
      console.error('entriesStore listener error', err);
    }
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function persist() {
  try {
    await storage.set<TimeEntry[]>(STORAGE_KEY, store.entries);
  } catch (err) {
    console.error('entriesStore persist error', err);
  }
}

function setEntriesInternal(next: TimeEntry[]) {
  store.entries = next;
  refreshSnapshot();
  void persist();
  emitChange();
}

async function hydrate() {
  try {
    const persisted = await storage.get<unknown>(STORAGE_KEY);
    if (Array.isArray(persisted)) {
      store.entries = persisted as TimeEntry[];
    } else {
      // Incompatible or missing data: reset to empty
      store.entries = [];
      await storage.set<TimeEntry[]>(STORAGE_KEY, []);
    }
    refreshSnapshot();
    emitChange();
  } catch (err) {
    console.error('entriesStore hydrate error', err);
    store.entries = [];
    refreshSnapshot();
    emitChange();
  }
}

const store: EntriesState = {
  entries: [],

  addEntry: (entry) => {
    setEntriesInternal([...store.entries, entry]);
  },

  updateEntry: (id, updates) => {
    setEntriesInternal(store.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  },

  deleteEntry: (id) => {
    setEntriesInternal(store.entries.filter((e) => e.id !== id));
  },

  changeEntryProject: (id, projectId) => {
    setEntriesInternal(store.entries.map((e) => (e.id === id ? { ...e, projectId } : e)));
  },

  updateEntryDuration: (id, additionalMs) => {
    setEntriesInternal(
      store.entries.map((e) => (e.id === id ? { ...e, duration: e.duration + additionalMs } : e))
    );
  },

  setEntries: (entries) => {
    setEntriesInternal(entries);
  },
};

let snapshot: EntriesState = {
  get entries() {
    return store.entries;
  },
  addEntry: store.addEntry,
  updateEntry: store.updateEntry,
  deleteEntry: store.deleteEntry,
  changeEntryProject: store.changeEntryProject,
  updateEntryDuration: store.updateEntryDuration,
  setEntries: store.setEntries,
};

function refreshSnapshot() {
  snapshot = {
    get entries() {
      return store.entries;
    },
    addEntry: store.addEntry,
    updateEntry: store.updateEntry,
    deleteEntry: store.deleteEntry,
    changeEntryProject: store.changeEntryProject,
    updateEntryDuration: store.updateEntryDuration,
    setEntries: store.setEntries,
  };
}

void hydrate();

function getSnapshot(): EntriesState {
  return snapshot;
}

export function useEntriesStore(): EntriesState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
