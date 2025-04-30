import { useCallback, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TimeEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { entriesReducer, EntriesState, entriesActions } from '../reducers/entriesReducer';

/**
 * Core hook for managing time entries state
 * This is a lower-level hook that handles only entries state management
 */
export function useEntriesStore() {
  // Get initial entries from localStorage
  const [storedEntries, setStoredEntries] = useLocalStorage<TimeEntry[]>(
    'harnesstime.entries', 
    []
  );
  
  // Set up reducer with initial state from localStorage
  const [entriesState, dispatchEntries] = useReducer(entriesReducer, { entries: storedEntries });
  
  // Sync reducer state back to localStorage whenever it changes
  useEffect(() => {
    setStoredEntries(entriesState.entries);
  }, [entriesState.entries, setStoredEntries]);

  // Add a new time entry
  const addEntry = useCallback(
    (projectId: string, duration: number = 0, note: string = '', start: string = new Date().toISOString()) => {
      const newEntry: TimeEntry = {
        id: uuidv4(),
        projectId,
        start,
        duration,
        note,
      };
      
      dispatchEntries(entriesActions.addEntry(newEntry));
      return newEntry;
    },
    [],
  );

  // Edit an existing entry
  const updateEntry = useCallback(
    (entryId: string, updates: Partial<TimeEntry>) => {
      dispatchEntries(entriesActions.updateEntry(entryId, updates));
    },
    [],
  );

  // Replace an entry with a completely new one
  const replaceEntry = useCallback(
    (entry: TimeEntry) => {
      dispatchEntries(entriesActions.updateEntry(entry.id, entry));
    },
    [],
  );

  // Delete an entry
  const deleteEntry = useCallback(
    (id: string) => {
      dispatchEntries(entriesActions.deleteEntry(id));
    },
    [],
  );

  // Change the project of an entry
  const changeEntryProject = useCallback(
    (id: string, projectId: string) => {
      dispatchEntries(entriesActions.changeEntryProject(id, projectId));
    },
    [],
  );

  // Add duration to an entry
  const updateEntryDuration = useCallback(
    (entryId: string, additionalDuration: number) => {
      dispatchEntries(entriesActions.updateEntryDuration(entryId, additionalDuration));
    },
    [],
  );
  
  // Set all entries (used for imports or migrations)
  const setEntries = useCallback((entries: TimeEntry[]) => {
    dispatchEntries(entriesActions.setEntries(entries));
  }, []);

  return {
    entries: entriesState.entries,
    addEntry,
    updateEntry,
    replaceEntry,
    deleteEntry,
    changeEntryProject,
    updateEntryDuration,
    setEntries
  };
} 