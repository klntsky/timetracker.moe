import { useCallback, useEffect, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TimeEntry, Project } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useTimer } from './useTimer';
import { match, P } from 'ts-pattern';
import { isToday, calculateElapsedMs, ensureArray } from '../utils/timeUtils';
import { findEntryById, projectExists, shouldShowResumeButton } from '../utils/stateUtils';
import { timerReducer, TimerState, timerActions } from '../reducers/timerReducer';
import { entriesReducer, EntriesState, entriesActions } from '../reducers/entriesReducer';

export function useTimeEntries() {
  // Get initial entries from localStorage
  const [storedEntries, setStoredEntries] = useLocalStorage<TimeEntry[]>(
    'harnesstime.entries', 
    []
  );
  
  // Get initial timer state from localStorage
  const [storedTimer, setStoredTimer] = useLocalStorage<TimerState>(
    'harnesstime.timer', 
    { running: false, start: null, lastEntryId: null, lastProjectId: null }
  );
  
  // Set up reducers with initial state from localStorage
  const [timerState, dispatchTimer] = useReducer(timerReducer, storedTimer);
  const [entriesState, dispatchEntries] = useReducer(entriesReducer, { entries: storedEntries });
  
  // Set up timer instance
  const timerInstance = useTimer(timerState.running, timerState.start);

  // Sync reducer state back to localStorage whenever it changes
  useEffect(() => {
    setStoredTimer(timerState);
  }, [timerState, setStoredTimer]);

  useEffect(() => {
    setStoredEntries(entriesState.entries);
  }, [entriesState.entries, setStoredEntries]);
  
  // Sync timer instance state with reducer state
  useEffect(() => {
    if (timerInstance.running !== timerState.running || timerInstance.startIso !== timerState.start) {
      dispatchTimer(timerActions.updateTimerState(timerInstance.running, timerInstance.startIso));
    }
  }, [timerInstance.running, timerInstance.startIso, timerState.running, timerState.start]);

  // Add a new time entry
  const addEntry = useCallback(
    (projectId: string, duration: number = 0, note: string = '', start: string = new Date().toISOString()) => {
      const newEntry: TimeEntry = {
        id: uuidv4(),
        projectId,
        start,
        duration,
        note,
        active: true,
      };
      
      dispatchEntries(entriesActions.addEntry(newEntry));
      return newEntry;
    },
    [],
  );

  // Start the timer on a specific entry
  const startTimer = useCallback(
    (projectId: string, entryId?: string, note: string = '') => {
      const now = new Date().toISOString();
      let targetEntryId = entryId;
      
      // If no entry ID is provided, create a new entry
      if (!targetEntryId) {
        const newEntry = addEntry(projectId, 0, note, now);
        targetEntryId = newEntry.id;
      } else {
        // If we're resuming an existing entry, mark it as active
        dispatchEntries(entriesActions.updateEntry(targetEntryId, { active: true }));
      }
      
      // Start the timer instance
      timerInstance.start();
      
      // Update the timer state
      dispatchTimer(timerActions.startTimer(targetEntryId, projectId, now));
    },
    [addEntry, timerInstance, dispatchEntries],
  );

  // Stop the active timer
  const stopTimer = useCallback(() => {
    if (!timerState.running || !timerState.start) return;
    
    const now = new Date();
    const startTime = new Date(timerState.start);
    const elapsedMs = now.getTime() - startTime.getTime();
    
    // Update the entry with accumulated time if it exists
    if (timerState.lastEntryId) {
      const entryExists = entriesState.entries.some(e => e.id === timerState.lastEntryId);
      if (entryExists) {
        // Update the duration and set active to false
        dispatchEntries(entriesActions.updateEntryDuration(timerState.lastEntryId, elapsedMs));
        dispatchEntries(entriesActions.updateEntry(timerState.lastEntryId, { active: false }));
      }
    }
    
    // Stop the timer instance
    timerInstance.stop();
    
    // Update timer state
    dispatchTimer(timerActions.stopTimer());
  }, [timerState, entriesState.entries, timerInstance, dispatchEntries]);

  // Toggle timer (start/stop)
  const toggleTimer = useCallback((projects: Project[] = []) => {
    if (timerState.running) {
      stopTimer();
    } else {
      const safeProjects = ensureArray(projects);
      // Try to resume the previously active entry
      const existingEntry = findEntryById(entriesState.entries, timerState.lastEntryId);
      
      match({ 
        existingEntry, 
        lastProjectId: timerState.lastProjectId, 
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
          projects: P.when(p => p.some(proj => proj.id === timerState.lastProjectId))
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
  }, [timerState, entriesState.entries, stopTimer, startTimer]);

  // Check if Resume button should be shown
  const canResume = useCallback((projects: Project[] = []) => {
    return shouldShowResumeButton(
      timerState.running,
      timerState.lastEntryId,
      entriesState.entries,
      timerState.lastProjectId,
      ensureArray(projects)
    );
  }, [timerState.running, timerState.lastEntryId, timerState.lastProjectId, entriesState.entries]);

  // Edit an existing entry
  const editEntry = useCallback(
    (entry: TimeEntry) => {
      dispatchEntries(entriesActions.updateEntry(entry.id, entry));
    },
    [],
  );

  // Delete an entry
  const deleteEntry = useCallback(
    (id: string) => {
      // If deleting the currently running entry, stop the timer
      if (timerState.running && timerState.lastEntryId === id) {
        stopTimer();
      }
      
      dispatchEntries(entriesActions.deleteEntry(id));
    },
    [timerState, stopTimer],
  );

  // Change the project of an entry
  const changeEntryProject = useCallback(
    (id: string, projectId: string) => {
      // If changing the last used entry's project, update the timer state
      if (timerState.lastEntryId === id) {
        dispatchTimer(timerActions.updateProjectId(projectId));
      }
      
      dispatchEntries(entriesActions.changeEntryProject(id, projectId));
    },
    [timerState.lastEntryId],
  );

  // Resume an existing entry
  const resumeEntry = useCallback(
    (entry: TimeEntry) => {
      if (timerState.running) {
        stopTimer();
      }
      
      // Always resume the exact entry clicked
      startTimer(entry.projectId, entry.id);
    },
    [timerState.running, stopTimer, startTimer],
  );

  // Get the last used entry if it still exists
  const getLastUsedEntry = useCallback(() => {
    return findEntryById(entriesState.entries, timerState.lastEntryId);
  }, [entriesState.entries, timerState.lastEntryId]);

  // Calculate elapsed milliseconds if timer is running
  const getElapsedMs = useCallback(() => {
    return match({ running: timerState.running, start: timerState.start })
      .with({ running: true, start: P.not(P.nullish) }, ({ start }) => 
        calculateElapsedMs(start)
      )
      .otherwise(() => 0);
  }, [timerState.running, timerState.start]);
  
  // For backward compatibility and easier migration
  const setEntries = useCallback((entries: TimeEntry[]) => {
    dispatchEntries(entriesActions.setEntries(entries));
  }, []);

  // Return an object with all the required functions and state
  return {
    entries: entriesState.entries,
    setEntries,
    timer: timerState,
    lastUsedEntry: getLastUsedEntry(),
    isRunning: timerState.running,
    elapsedMs: getElapsedMs(),
    canResume,
    addEntry,
    startTimer,
    stopTimer,
    toggleTimer,
    editEntry,
    deleteEntry,
    changeEntryProject,
    resumeEntry,
  };
} 