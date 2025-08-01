import { match } from 'ts-pattern';
import { TimeEntry } from '../types';

// Define entries state
export interface EntriesState {
  entries: TimeEntry[];
}

// Define possible actions for the entries reducer
export type EntriesAction = 
  | { type: 'ADD_ENTRY'; entry: TimeEntry }
  | { type: 'UPDATE_ENTRY'; entryId: number; updates: Partial<TimeEntry> }
  | { type: 'DELETE_ENTRY'; entryId: number }
  | { type: 'UPDATE_ENTRY_DURATION'; entryId: number; additionalDuration: number }
  | { type: 'CHANGE_ENTRY_PROJECT'; entryId: number; projectId: number }
  | { type: 'SET_ENTRIES'; entries: TimeEntry[] };

// Entries action creator functions
export const entriesActions = {
  addEntry: (entry: TimeEntry): EntriesAction => ({
    type: 'ADD_ENTRY',
    entry
  }),
  
  updateEntry: (entryId: number, updates: Partial<TimeEntry>): EntriesAction => ({
    type: 'UPDATE_ENTRY',
    entryId,
    updates
  }),
  
  deleteEntry: (entryId: number): EntriesAction => ({
    type: 'DELETE_ENTRY',
    entryId
  }),
  
  updateEntryDuration: (entryId: number, additionalDuration: number): EntriesAction => ({
    type: 'UPDATE_ENTRY_DURATION',
    entryId,
    additionalDuration
  }),
  
  changeEntryProject: (entryId: number, projectId: number): EntriesAction => ({
    type: 'CHANGE_ENTRY_PROJECT',
    entryId,
    projectId
  }),
  
  setEntries: (entries: TimeEntry[]): EntriesAction => ({
    type: 'SET_ENTRIES',
    entries
  })
};

// Entries reducer function with ts-pattern
export function entriesReducer(state: EntriesState, action: EntriesAction): EntriesState {
  return match(action)
    .with({ type: 'ADD_ENTRY' }, ({ entry }: { entry: TimeEntry }) => ({
      ...state,
      entries: [...state.entries, entry]
    }))
    .with({ type: 'UPDATE_ENTRY' }, ({ entryId, updates }: { entryId: number; updates: Partial<TimeEntry> }) => ({
      ...state,
      entries: state.entries.map(e => 
        e.id === entryId ? { ...e, ...updates } : e
      )
    }))
    .with({ type: 'DELETE_ENTRY' }, ({ entryId }: { entryId: number }) => ({
      ...state,
      entries: state.entries.filter(e => e.id !== entryId)
    }))
    .with({ type: 'UPDATE_ENTRY_DURATION' }, ({ entryId, additionalDuration }: { entryId: number; additionalDuration: number }) => ({
      ...state,
      entries: state.entries.map(e => 
        e.id === entryId 
          ? { ...e, duration: e.duration + additionalDuration }
          : e
      )
    }))
    .with({ type: 'CHANGE_ENTRY_PROJECT' }, ({ entryId, projectId }: { entryId: number; projectId: number }) => ({
      ...state,
      entries: state.entries.map(e => 
        e.id === entryId 
          ? { ...e, projectId }
          : e
      )
    }))
    .with({ type: 'SET_ENTRIES' }, ({ entries }: { entries: TimeEntry[] }) => ({
      ...state,
      entries
    }))
    .exhaustive();
} 