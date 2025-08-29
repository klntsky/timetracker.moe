import { useSyncExternalStore } from 'react';
import { TimerState } from '../reducers/timerReducer';
import { storage } from '../storage';

interface TimerStoreState {
  running: boolean;
  start: string | null;
  lastEntryId: number | null;
  lastProjectId: number | null;
  tick: number;

  startTimer: (entryId: number, projectId: number, startTime?: string) => void;
  stopTimer: () => void;
  updateProjectId: (projectId: number) => void;
  setTimer: (timer: TimerState) => void;
  forceTick: () => void;

  getElapsedMs: () => number;
}

let timerInterval: ReturnType<typeof setInterval> | null = null;

const STORAGE_KEY = 'timetracker.moe.timer';

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch (err) {
      console.error('timerStore listener error', err);
    }
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function startInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerInterval = setInterval(() => {
    store.forceTick();
  }, 1000);
}

function stopInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function manageIntervalFromRunning() {
  if (store.running && store.start) {
    startInterval();
  } else {
    stopInterval();
  }
}

async function persist() {
  try {
    const toPersist: TimerState = {
      running: store.running,
      start: store.start,
      lastEntryId: store.lastEntryId,
      lastProjectId: store.lastProjectId,
    };
    await storage.set<TimerState>(STORAGE_KEY, toPersist);
  } catch (err) {
    console.error('timerStore persist error', err);
  }
}

function getSnapshot(): TimerStoreState {
  return snapshot;
}

async function hydrate() {
  try {
    const persisted = await storage.get<unknown>(STORAGE_KEY);
    const isTimerShape = (val: unknown): val is TimerState => {
      return !!val && typeof val === 'object' && 'running' in (val as Record<string, unknown>);
    };
    if (isTimerShape(persisted)) {
      const t = persisted;
      store.running = !!t.running;
      store.start = t.start ?? null;
      store.lastEntryId = t.lastEntryId ?? null;
      store.lastProjectId = t.lastProjectId ?? null;
    } else {
      // Reset to initial shape
      store.running = false;
      store.start = null;
      store.lastEntryId = null;
      store.lastProjectId = null;
      await storage.set<TimerState>(STORAGE_KEY, {
        running: false,
        start: null,
        lastEntryId: null,
        lastProjectId: null,
      });
    }
    refreshSnapshot();
    manageIntervalFromRunning();
    emitChange();
  } catch (err) {
    console.error('timerStore hydrate error', err);
    store.running = false;
    store.start = null;
    store.lastEntryId = null;
    store.lastProjectId = null;
    refreshSnapshot();
    manageIntervalFromRunning();
    emitChange();
  }
}

const store: TimerStoreState = {
  running: false,
  start: null,
  lastEntryId: null,
  lastProjectId: null,
  tick: 0,

  startTimer: (entryId, projectId, startTime) => {
    store.running = true;
    store.start = startTime || new Date().toISOString();
    store.lastEntryId = entryId;
    store.lastProjectId = projectId;
    refreshSnapshot();
    manageIntervalFromRunning();
    void persist();
    emitChange();
  },

  stopTimer: () => {
    store.running = false;
    store.start = null;
    refreshSnapshot();
    manageIntervalFromRunning();
    void persist();
    emitChange();
  },

  updateProjectId: (projectId) => {
    store.lastProjectId = projectId;
    refreshSnapshot();
    void persist();
    emitChange();
  },

  setTimer: (timer) => {
    store.running = !!timer.running;
    store.start = timer.start ?? null;
    store.lastEntryId = timer.lastEntryId ?? null;
    store.lastProjectId = timer.lastProjectId ?? null;
    refreshSnapshot();
    manageIntervalFromRunning();
    void persist();
    emitChange();
  },

  forceTick: () => {
    store.tick = store.tick + 1;
    refreshSnapshot();
    emitChange();
  },

  getElapsedMs: () => {
    if (!store.running || !store.start) return 0;
    const now = new Date();
    const startTime = new Date(store.start);
    return Math.max(0, now.getTime() - startTime.getTime());
  },
};

let snapshot: TimerStoreState = {
  get running() {
    return store.running;
  },
  get start() {
    return store.start;
  },
  get lastEntryId() {
    return store.lastEntryId;
  },
  get lastProjectId() {
    return store.lastProjectId;
  },
  get tick() {
    return store.tick;
  },
  startTimer: store.startTimer,
  stopTimer: store.stopTimer,
  updateProjectId: store.updateProjectId,
  setTimer: store.setTimer,
  forceTick: store.forceTick,
  getElapsedMs: store.getElapsedMs,
};

function refreshSnapshot() {
  snapshot = {
    get running() {
      return store.running;
    },
    get start() {
      return store.start;
    },
    get lastEntryId() {
      return store.lastEntryId;
    },
    get lastProjectId() {
      return store.lastProjectId;
    },
    get tick() {
      return store.tick;
    },
    startTimer: store.startTimer,
    stopTimer: store.stopTimer,
    updateProjectId: store.updateProjectId,
    setTimer: store.setTimer,
    forceTick: store.forceTick,
    getElapsedMs: store.getElapsedMs,
  };
}

void hydrate();

export function useTimerStore(): TimerStoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
