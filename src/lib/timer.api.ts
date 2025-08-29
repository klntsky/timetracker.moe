import { TimerState } from '../reducers/timerReducer';
import { storage } from '../storage';

const KEY = 'timetracker.moe.timer';

const initialTimer: TimerState = {
  running: false,
  start: null,
  lastEntryId: null,
  lastProjectId: null,
};

export async function getTimer(): Promise<TimerState> {
  const data = await storage.get<TimerState | null>(KEY);
  if (data && typeof data === 'object' && 'running' in data) return data;
  await storage.set(KEY, initialTimer);
  return initialTimer;
}

export async function setTimer(timer: TimerState): Promise<void> {
  await storage.set<TimerState>(KEY, timer);
}
