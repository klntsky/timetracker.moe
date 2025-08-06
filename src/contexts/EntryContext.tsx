import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { TimeEntry } from '../types';
import { useEntriesStore } from '../stores/entriesStore';
import { useTimerStore } from '../stores/timerStore';
import { findEntryById } from '../utils/stateUtils';

interface EntryContextValue {
  // State
  entries: TimeEntry[];
  lastUsedEntry?: TimeEntry | null;
  
  // Core operations
  setEntries: (entries: TimeEntry[]) => void;
  addEntry: (entry: TimeEntry) => void;
  updateEntry: (entryId: number, updates: Partial<TimeEntry>) => void;
  
  // Enhanced operations (with timer integration)
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, projectId: number) => void;
  
  // Compatibility
  addLegacyEntry?: (projectId: number, duration: number, note?: string, start?: string) => TimeEntry;
}

const EntryContext = createContext<EntryContextValue | undefined>(undefined);

export function EntryProvider({ 
  children,
  addLegacyEntry,
}: { 
  children: ReactNode;
  addLegacyEntry?: (projectId: number, duration: number, note?: string, start?: string) => TimeEntry;
}) {
  // Get state from stores
  const {
    entries,
    addEntry,
    updateEntry,
    deleteEntry: deleteEntryBase,
    changeEntryProject: changeEntryProjectBase,
    setEntries,
  } = useEntriesStore();

  const {
    running: isRunning,
    lastEntryId,
    stopTimer,
    updateProjectId,
  } = useTimerStore();

  // Enhanced delete with timer handling
  const deleteEntry = useCallback(
    (id: number) => {
      // If deleting the currently running entry, stop the timer
      if (isRunning && lastEntryId === id) {
        stopTimer();
      }

      deleteEntryBase(id);
    },
    [isRunning, lastEntryId, stopTimer, deleteEntryBase],
  );

  // Enhanced changeEntryProject with timer state update
  const changeEntryProject = useCallback(
    (id: number, projectId: number) => {
      // If changing the last used entry's project, update the timer state
      if (lastEntryId === id) {
        updateProjectId(projectId);
      }

      changeEntryProjectBase(id, projectId);
    },
    [lastEntryId, updateProjectId, changeEntryProjectBase],
  );

  // Compute lastUsedEntry
  const lastUsedEntry = findEntryById(entries, lastEntryId);

  return (
    <EntryContext.Provider 
      value={{
        entries,
        setEntries,
        addEntry,
        updateEntry,
        deleteEntry,
        changeEntryProject,
        lastUsedEntry,
        addLegacyEntry,
      }}
    >
      {children}
    </EntryContext.Provider>
  );
}

export function useEntryContext() {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntryContext must be used within an EntryProvider');
  }
  return context;
} 