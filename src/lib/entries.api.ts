import { TimeEntry } from '../types';
import { storage } from '../storage';

const KEY = 'timetracker.moe.entries';

export async function getEntries(): Promise<TimeEntry[]> {
  const data = await storage.get<TimeEntry[] | null>(KEY);
  return Array.isArray(data) ? data : [];
}

export async function setEntries(next: TimeEntry[]): Promise<void> {
  await storage.set<TimeEntry[]>(KEY, next);
}
