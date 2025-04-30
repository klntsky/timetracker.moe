import { useCallback } from 'react';
import { TimeEntry, Project } from '../types';
import { match, P } from 'ts-pattern';
import { isToday, ensureArray } from '../utils/timeUtils';
import { findEntryById, projectExists, shouldShowResumeButton } from '../utils/stateUtils';
import { useEntriesStore } from './useEntriesStore';
import { useTimerStore } from './useTimerStore';

/**
 * High-level hook that combines entries and timer management with business logic
 * This hook uses the lower-level hooks (useEntriesStore, useTimerStore) and adds
 * application-specific behaviors on top
 */
export function useTimeEntries() {
  // Use the store hooks
  const entriesStore = useEntriesStore();
  const timerStore = useTimerStore();
  
  // Destructure for convenience
  const { 
    entries, 
    addEntry, 
    updateEntry, 
    replaceEntry, 
    deleteEntry: deleteEntryBase, 
    changeEntryProject: changeEntryProjectBase, 
    updateEntryDuration,
    setEntries 
  } = entriesStore;
  
  const { 
    timer, 
    isRunning, 
    startTimer: startTimerBase, 
    stopTimer: stopTimerBase, 
    updateProjectId, 
    elapsedMs 
  } = timerStore;

  // Create a new entry and start timer on it
  const startNewEntry = useCallback(
    (projectId: string, note: string = '') => {
      const now = new Date().toISOString();
      // Create the entry
      const newEntry = addEntry(projectId, 0, note, now);
      // Mark it as active
      updateEntry(newEntry.id, { active: true });
      // Start the timer on this entry
      startTimerBase(newEntry.id, projectId, now);
      return newEntry;
    },
    [addEntry, updateEntry, startTimerBase]
  );

  // Start the timer on a specific entry (new or existing)
  const startTimer = useCallback(
    (projectId: string, entryId?: string, note: string = '') => {
      const now = new Date().toISOString();
      
      if (entryId) {
        // For existing entries, mark as active and start timer
        updateEntry(entryId, { active: true });
        startTimerBase(entryId, projectId, now);
      } else {
        // For new entries, create entry and start timer
        startNewEntry(projectId, note);
      }
    },
    [updateEntry, startTimerBase, startNewEntry]
  );

  // Stop the active timer and update the entry
  const stopTimer = useCallback(() => {
    if (!isRunning || !timer.start || !timer.lastEntryId) return;
    
    // Calculate the time that has elapsed
    const now = new Date();
    const startTime = new Date(timer.start);
    const elapsedMs = now.getTime() - startTime.getTime();
    
    // Update the entry that was being timed
    const entryExists = entries.some(e => e.id === timer.lastEntryId);
    if (entryExists) {
      // Update duration and set active to false
      updateEntryDuration(timer.lastEntryId, elapsedMs);
      updateEntry(timer.lastEntryId, { active: false });
    }
    
    // Stop the timer
    stopTimerBase();
  }, [isRunning, timer, entries, updateEntryDuration, updateEntry, stopTimerBase]);

  // Toggle timer (start/stop)
  const toggleTimer = useCallback((projects: Project[] = []) => {
    if (isRunning) {
      stopTimer();
    } else {
      const safeProjects = ensureArray(projects);
      // Try to resume the previously active entry
      const existingEntry = findEntryById(entries, timer.lastEntryId);
      
      match({ 
        existingEntry, 
        lastProjectId: timer.lastProjectId, 
        projectsLength: safeProjects.length,
        projects: safeProjects
      })
        .with({ existingEntry: P.not(P.nullish) }, ({ existingEntry, projects }) => {
          // Check if the project still exists
          const projectStillExists = projectExists(projects, existingEntry.projectId);
          
          if (projectStillExists) {
            // Case 1: Last entry exists and its project exists
            if (isToday(existingEntry.start)) {
              // If the entry is from today, resume it
              startTimer(existingEntry.projectId, existingEntry.id);
            } else {
              // If the entry is from a different day, create a new entry with the same note
              startTimer(existingEntry.projectId, undefined, existingEntry.note);
            }
          } else if (projects.length === 1) {
            // Project doesn't exist but there's exactly one project
            startTimer(projects[0].id, undefined, existingEntry.note);
          }
          // If no projects or multiple projects exist, the button should be hidden by canResume
        })
        .with({ 
          existingEntry: P.nullish, 
          lastProjectId: P.not(P.nullish),
          projects: P.when(p => p.some(proj => proj.id === timer.lastProjectId))
        }, ({ lastProjectId }) => {
          // Case 2: Entry was deleted but project still exists
          startTimer(lastProjectId);
        })
        .with({ 
          existingEntry: P.nullish, 
          projectsLength: 1 
        }, ({ projects }) => {
          // Case 3: No previous entry or project, but there's exactly one project
          // Always start timer on the only project available
          startTimer(projects[0].id);
        })
        .otherwise(() => {
          // If none of these conditions are met, the button should be hidden by canResume
        });
    }
  }, [isRunning, timer, entries, stopTimer, startTimer]);

  // Check if Resume button should be shown
  const canResume = useCallback((projects: Project[] = []) => {
    return shouldShowResumeButton(
      isRunning,
      timer.lastEntryId,
      entries,
      timer.lastProjectId,
      ensureArray(projects)
    );
  }, [isRunning, timer.lastEntryId, timer.lastProjectId, entries]);

  // Delete an entry with timer handling
  const deleteEntry = useCallback(
    (id: string) => {
      // If deleting the currently running entry, stop the timer
      if (isRunning && timer.lastEntryId === id) {
        stopTimer();
      }
      
      deleteEntryBase(id);
    },
    [isRunning, timer.lastEntryId, stopTimer, deleteEntryBase],
  );

  // Change the project of an entry
  const changeEntryProject = useCallback(
    (id: string, projectId: string) => {
      // If changing the last used entry's project, update the timer state
      if (timer.lastEntryId === id) {
        updateProjectId(projectId);
      }
      
      changeEntryProjectBase(id, projectId);
    },
    [timer.lastEntryId, updateProjectId, changeEntryProjectBase],
  );

  // Resume an existing entry
  const resumeEntry = useCallback(
    (entry: TimeEntry) => {
      if (isRunning) {
        stopTimer();
      }
      
      // Always resume the exact entry clicked
      startTimer(entry.projectId, entry.id);
    },
    [isRunning, stopTimer, startTimer],
  );

  // Get the last used entry if it still exists
  const getLastUsedEntry = useCallback(() => {
    return findEntryById(entries, timer.lastEntryId);
  }, [entries, timer.lastEntryId]);

  // Return an object with all the required functions and state
  return {
    entries,
    setEntries,
    timer,
    lastUsedEntry: getLastUsedEntry(),
    isRunning,
    elapsedMs,
    canResume,
    addEntry,
    startTimer,
    stopTimer,
    toggleTimer,
    editEntry: replaceEntry,
    deleteEntry,
    changeEntryProject,
    resumeEntry,
  };
} 