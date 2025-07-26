import { z } from 'zod';
import { TimeEntry, Project, Settings } from '../types';

/**
 * Storage schemas with minimal field names for efficient storage
 * Fields:
 * TimeEntry: i=id, p=projectId, s=start, d=duration, n=note, a=active (omitted if false)
 * Project: i=id, n=name, u=updatedAt, b=billableRate
 * Settings: w=weekEndsOn
 */

// Storage schema for time entries (minimal field names)
export const StorageTimeEntrySchema = z.object({
  i: z.number(), // id
  p: z.number(), // projectId
  s: z.string(), // start (ISO string)
  d: z.number(), // duration in milliseconds
  n: z.string().optional(), // note
  a: z.literal(true).optional() // active (only stored if true)
});

// Storage schema for billable rate
const StorageBillableRateSchema = z.object({
  a: z.number(), // amount
  c: z.string()  // currency
});

// Storage schema for projects (minimal field names)
export const StorageProjectSchema = z.object({
  i: z.number(), // id
  n: z.string(), // name
  u: z.string(), // updatedAt
  b: StorageBillableRateSchema.optional() // billableRate
});

// Storage schema for settings (minimal field names)
export const StorageSettingsSchema = z.object({
  w: z.enum(['sunday', 'saturday']) // weekEndsOn
});

// Array schemas
export const StorageTimeEntriesSchema = z.array(StorageTimeEntrySchema);
export const StorageProjectsSchema = z.array(StorageProjectSchema);

// Storage types (inferred from schemas)
export type StorageTimeEntry = z.infer<typeof StorageTimeEntrySchema>;
export type StorageProject = z.infer<typeof StorageProjectSchema>;
export type StorageSettings = z.infer<typeof StorageSettingsSchema>;

/**
 * Convert full TimeEntry to storage format
 */
export function timeEntryToStorage(entry: TimeEntry): StorageTimeEntry {
  const storage: StorageTimeEntry = {
    i: entry.id,
    p: entry.projectId,
    s: entry.start,
    d: entry.duration
  };
  
  if (entry.note) storage.n = entry.note;
  if (entry.active === true) storage.a = true; // Only store if true
  
  return storage;
}

/**
 * Convert storage format to full TimeEntry
 */
export function timeEntryFromStorage(storage: StorageTimeEntry): TimeEntry {
  return {
    id: storage.i,
    projectId: storage.p,
    start: storage.s,
    duration: storage.d,
    note: storage.n,
    active: storage.a === true // false if not present
  };
}

/**
 * Convert full Project to storage format
 */
export function projectToStorage(project: Project): StorageProject {
  const storage: StorageProject = {
    i: project.id,
    n: project.name,
    u: project.updatedAt
  };
  
  if (project.billableRate) {
    storage.b = {
      a: project.billableRate.amount,
      c: project.billableRate.currency
    };
  }
  
  return storage;
}

/**
 * Convert storage format to full Project
 */
export function projectFromStorage(storage: StorageProject): Project {
  const project: Project = {
    id: storage.i,
    name: storage.n,
    updatedAt: storage.u
  };
  
  if (storage.b) {
    project.billableRate = {
      amount: storage.b.a,
      currency: storage.b.c
    };
  }
  
  return project;
}

/**
 * Convert full Settings to storage format
 */
export function settingsToStorage(settings: Settings): StorageSettings {
  return {
    w: settings.weekEndsOn
  };
}

/**
 * Convert storage format to full Settings
 */
export function settingsFromStorage(storage: StorageSettings): Settings {
  return {
    weekEndsOn: storage.w
  };
} 