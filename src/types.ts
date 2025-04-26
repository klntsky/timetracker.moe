export interface TimeEntry {
  id: string;
  projectId: string;
  start: string; // ISO
  end?: string;  // ISO - optional for active/running entries
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