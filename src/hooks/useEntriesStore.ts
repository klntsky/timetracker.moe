import { useCallback, useReducer, useEffect } from 'react';
import { generateId } from '../utils/idGenerator';
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
    (projectId: number, duration: number = 0, note: string = '', start: string = new Date().toISOString()) => {
      const newEntry: TimeEntry = {
        id: generateId(),
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
    (entryId: number, updates: Partial<TimeEntry>) => {
      dispatchEntries(entriesActions.updateEntry(entryId, updates));
    },
    [],
  );

  // Delete an entry
  const deleteEntry = useCallback(
    (id: number) => {
      dispatchEntries(entriesActions.deleteEntry(id));
    },
    [],
  );

  // Change the project of an entry
  const changeEntryProject = useCallback(
    (id: number, projectId: number) => {
      dispatchEntries(entriesActions.changeEntryProject(id, projectId));
    },
    [],
  );

  // Add duration to an entry
  const updateEntryDuration = useCallback(
    (entryId: number, additionalDuration: number) => {
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
    deleteEntry,
    changeEntryProject,
    updateEntryDuration,
    setEntries
  };
} 