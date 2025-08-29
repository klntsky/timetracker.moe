import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { TimeEntry } from '../types';
import { useEntriesQuery } from '../hooks/useEntriesQuery';
import { useTimerQuery } from '../hooks/useTimerQuery';
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
}

const EntryContext = createContext<EntryContextValue | undefined>(undefined);

export function EntryProvider({ children }: { children: ReactNode }) {
  const {
    entries,
    addEntry,
    updateEntry,
    deleteEntry: deleteEntryBase,
    changeEntryProject: changeEntryProjectBase,
    setEntries,
  } = useEntriesQuery();

  const {
    timer: { running: isRunning, lastEntryId },
    stopTimer,
    updateProjectId,
  } = useTimerQuery();

  const deleteEntry = useCallback(
    (id: number) => {
      if (isRunning && lastEntryId === id) {
        stopTimer();
      }
      deleteEntryBase(id);
    },
    [isRunning, lastEntryId, stopTimer, deleteEntryBase]
  );

  const changeEntryProject = useCallback(
    (id: number, projectId: number) => {
      if (lastEntryId === id) {
        updateProjectId(projectId);
      }
      changeEntryProjectBase(id, projectId);
    },
    [lastEntryId, updateProjectId, changeEntryProjectBase]
  );

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
