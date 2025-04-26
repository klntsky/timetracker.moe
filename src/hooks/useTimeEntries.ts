import { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TimeEntry, Project } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useTimer } from './useTimer';

interface TimerStore {
  running: boolean;
  start: string | null;
  lastEntryId: string | null;
  lastProjectId: string | null;
}

export function useTimeEntries() {
  // Store time entries in localStorage
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>('harnesstime.entries', []);
  
  // Track timer and last used entry/project in localStorage
  const [timer, setTimer] = useLocalStorage<TimerStore>('harnesstime.timer', { 
    running: false, 
    start: null, 
    lastEntryId: null,
    lastProjectId: null 
  });

  const timerInstance = useTimer(timer.running, timer.start);
  
  // Update timer from timer instance
  useEffect(() => {
    if (timerInstance.running !== timer.running || timerInstance.startIso !== timer.start) {
      setTimer({
        ...timer,
        running: timerInstance.running,
        start: timerInstance.startIso
      });
    }
  }, [timerInstance.running, timerInstance.startIso, timer, setTimer]);

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
      
      setEntries([...entries, newEntry]);
      return newEntry;
    },
    [entries, setEntries],
  );

  // Start the timer on a specific entry
  const startTimer = useCallback(
    (projectId: string, entryId?: string) => {
      const now = new Date().toISOString();
      let targetEntryId = entryId;
      
      // If no entry ID is provided, create a new entry
      if (!targetEntryId) {
        const newEntry = addEntry(projectId, 0, '', now);
        targetEntryId = newEntry.id;
      }
      
      // Update timer state
      setTimer({
        running: true,
        start: now,
        lastEntryId: targetEntryId,
        lastProjectId: projectId
      });
      
      // Start the timer instance
      timerInstance.start();
    },
    [addEntry, setTimer, timerInstance],
  );

  // Stop the active timer
  const stopTimer = useCallback(() => {
    if (!timer.running || !timer.start) return;
    
    const now = new Date();
    const startTime = new Date(timer.start);
    const elapsedMs = now.getTime() - startTime.getTime();
    
    // Update the entry with accumulated time if it exists
    if (timer.lastEntryId) {
      setEntries(
        entries.map((e) => {
          if (e.id === timer.lastEntryId) {
            return {
              ...e,
              duration: e.duration + elapsedMs,
            };
          }
          return e;
        }),
      );
    }
    
    // Stop the timer instance
    timerInstance.stop();
    
    // Update timer state (keep last entry and project references)
    setTimer({
      ...timer,
      running: false,
      start: null
    });
  }, [timer, entries, setEntries, setTimer, timerInstance]);

  // Toggle timer (start/stop)
  const toggleTimer = useCallback((projects: Project[]) => {
    if (timer.running) {
      stopTimer();
    } else {
      // Try to resume the previously active entry
      const existingEntry = timer.lastEntryId ? entries.find(e => e.id === timer.lastEntryId) : null;
      
      if (existingEntry) {
        // Case 1: Last entry exists - resume it
        startTimer(existingEntry.projectId, existingEntry.id);
      } else if (timer.lastProjectId) {
        // Case 2: Entry was deleted but project still exists
        const projectExists = projects.some(p => p.id === timer.lastProjectId);
        
        if (projectExists) {
          // Create a new entry in the same project
          startTimer(timer.lastProjectId);
        } else if (projects.length === 1) {
          // Project doesn't exist but there's exactly one project
          startTimer(projects[0].id);
        }
        // If multiple projects exist but we don't know which one to use,
        // we'll rely on canResume to determine if button should be shown
      } else if (projects.length === 1) {
        // Case 3: No previous entry or project, but there's only one project
        // Always start timer on the only project available
        startTimer(projects[0].id);
      }
      // If none of these conditions are met, the button should be hidden by canResume
    }
  }, [timer, entries, stopTimer, startTimer]);

  // Check if Resume button should be shown
  const canResume = useCallback((projects: Project[]) => {
    if (timer.running) {
      return false; // Don't show resume if already running
    }
    
    // Case 1: Last entry exists - show button
    if (timer.lastEntryId && entries.some(e => e.id === timer.lastEntryId)) {
      return true;
    }
    
    // Case 2: Last project exists - show button
    if (timer.lastProjectId && projects.some(p => p.id === timer.lastProjectId)) {
      return true;
    }
    
    // Case 3: No last project but exactly one project exists - show button
    if (projects.length === 1) {
      return true;
    }
    
    // Otherwise: Don't show button
    return false;
  }, [timer.running, timer.lastEntryId, timer.lastProjectId, entries]);

  // Edit an existing entry
  const editEntry = useCallback(
    (entry: TimeEntry) => {
      setEntries(
        entries.map((e) => {
          if (e.id === entry.id) {
            return entry;
          }
          return e;
        }),
      );
    },
    [entries, setEntries],
  );

  // Delete an entry
  const deleteEntry = useCallback(
    (id: string) => {
      // If deleting the currently running entry, stop the timer
      if (timer.running && timer.lastEntryId === id) {
        stopTimer();
      }
      
      setEntries(entries.filter((e) => e.id !== id));
    },
    [entries, setEntries, timer, stopTimer],
  );

  // Change the project of an entry
  const changeEntryProject = useCallback(
    (id: string, projectId: string) => {
      // If changing the last used entry's project, update the lastProjectId
      if (timer.lastEntryId === id) {
        setTimer({
          ...timer,
          lastProjectId: projectId
        });
      }
      
      setEntries(
        entries.map((e) => {
          if (e.id === id) {
            return { ...e, projectId };
          }
          return e;
        }),
      );
    },
    [entries, setEntries, timer, setTimer],
  );

  // Resume an existing entry
  const resumeEntry = useCallback(
    (entry: TimeEntry) => {
      if (timer.running) {
        stopTimer();
      }
      startTimer(entry.projectId, entry.id);
    },
    [timer, stopTimer, startTimer],
  );

  // Get the last used entry if it still exists
  const getLastUsedEntry = useCallback(() => {
    if (!timer.lastEntryId) return null;
    return entries.find(e => e.id === timer.lastEntryId) || null;
  }, [entries, timer.lastEntryId]);

  // Calculate elapsed milliseconds if timer is running
  const elapsedMs = useCallback(() => {
    if (timer.running && timer.start) {
      return new Date().getTime() - new Date(timer.start).getTime();
    }
    return 0;
  }, [timer.running, timer.start]);

  return {
    entries,
    setEntries,
    timer,
    lastUsedEntry: getLastUsedEntry(),
    isRunning: timer.running,
    elapsedMs: elapsedMs(),
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