export interface TimeEntry {
  id: string;
  projectId: string;
  start: string; // ISO
  end: string;   // ISO
  note?: string;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: string; // for last‑used detection
}

export interface Settings {
  weekEndsOn: 'sunday' | 'saturday';
}