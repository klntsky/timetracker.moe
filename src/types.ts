export interface TimeEntry {
  id: number;
  projectId: number;
  start: string; // ISO
  duration: number; // duration in milliseconds
  note?: string;
  active?: boolean; // whether the entry is currently active/running
}

export interface Project {
  id: number;
  name: string;
  updatedAt: string; // for last‑used detection
  billableRate?: {
    amount: number;
    currency: string;
  };
}

export interface Settings {
  weekEndsOn: 'sunday' | 'saturday';
}