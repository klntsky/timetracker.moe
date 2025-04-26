import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TimeEntry, Project } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useTimer } from './useTimer';

interface TimerStore {
  running: boolean;
  start: string | null;
  entryId: string | null;
}

export function useTimeEntries() {
  // Store time entries in localStorage
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>('harnesstime.entries', []);
  
  // Track active timer in localStorage
  const [timer, setTimer] = useLocalStorage<{ running: boolean; start: string | null; entryId: string | null; 
  }>('harnesstime.timer', { running: false, start: null, entryId: null });

  const timerInstance = useTimer(timer.running, timer.start);
  
  // Find the active entry (if any)
  const activeEntry = useCallback(() => entries.find((e) => e.active), [entries]);

  // Update timer store whenever timer state changes
  useCallback(() => {
    setTimer({ running: timerInstance.running, start: timerInstance.startIso, entryId: timer.entryId });
  }, [timerInstance.running, timerInstance.startIso, timer.entryId]);

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

  // Start the timer on a new or existing entry
  const startTimer = useCallback(
    (projectId: string, existingEntry?: TimeEntry) => {
      // Clear any existing active timer
      setEntries(
        entries.map((e) => {
          if (e.active) {
            return { ...e, active: false };
          }
          return e;
        }),
      );
      
      const now = new Date().toISOString();
      let entryId: string;
      
      if (existingEntry) {
        // Resume an existing entry
        entryId = existingEntry.id;
        setEntries(
          entries.map((e) => {
            if (e.id === entryId) {
              return { ...e, active: true };
            }
            return e;
          }),
        );
      } else {
        // Create a new active entry
        const newEntry = addEntry(projectId, 0, '', now);
        entryId = newEntry.id;
        setEntries(
          entries.map((e) => {
            if (e.id === entryId) {
              return { ...e, active: true };
            }
            return e;
          }),
        );
      }
      
      // Update timer state
      setTimer({
        running: true,
        start: now,
        entryId,
      });
    },
    [entries, setEntries, addEntry, setTimer],
  );

  // Stop the active timer
  const stopTimer = useCallback(() => {
    if (!timer.running || !timer.entryId || !timer.start) return;
    
    const now = new Date();
    const startTime = new Date(timer.start);
    const elapsedMs = now.getTime() - startTime.getTime();
    
    // Update the entry with accumulated time
    setEntries(
      entries.map((e) => {
        if (e.id === timer.entryId) {
          return {
            ...e,
            active: false,
            duration: e.duration + elapsedMs,
          };
        }
        return e;
      }),
    );
    
    // Reset timer state
    setTimer({
      running: false,
      start: null,
      entryId: null,
    });
  }, [timer, entries, setEntries, setTimer]);

  // Toggle timer (start/stop)
  const toggleTimer = useCallback(() => {
    if (timer.running) {
      stopTimer();
    } else {
      const activeEntry = entries.find((e) => e.active);
      if (activeEntry) {
        startTimer(activeEntry.projectId, activeEntry);
      }
    }
  }, [timer, entries, startTimer, stopTimer]);

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
      setEntries(entries.filter((e) => e.id !== id));
    },
    [entries, setEntries],
  );

  // Change the project of an entry
  const changeEntryProject = useCallback(
    (id: string, projectId: string) => {
      setEntries(
        entries.map((e) => {
          if (e.id === id) {
            return { ...e, projectId };
          }
          return e;
        }),
      );
    },
    [entries, setEntries],
  );

  // Resume an existing entry
  const resumeEntry = useCallback(
    (entry: TimeEntry) => {
      const activeProject = entry.projectId;
      startTimer(activeProject, entry);
    },
    [startTimer],
  );

  // Get the active entry
  const getActiveEntry = useCallback(() => {
    return entries.find((e) => e.active) || null;
  }, [entries]);

  return {
    entries,
    setEntries,
    timer,
    activeEntry: getActiveEntry(),
    isRunning: timer.running,
    elapsedMs: timer.running && timer.start ? new Date().getTime() - new Date(timer.start).getTime() : 0,
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