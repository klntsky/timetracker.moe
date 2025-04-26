import { useMemo, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from './useLocalStorage';
import { TimeEntry } from '../types';
import { useTimer } from './useTimer';

interface TimerStore {
  running: boolean;
  start: string | null;
  entryId: string | null;
}

export function useTimeEntries() {
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>('harvest.entries', []);
  const [timerStore, setTimerStore] = useLocalStorage<TimerStore>(
    'harvest.timer', 
    { running: false, start: null, entryId: null }
  );
  
  const timer = useTimer(timerStore.running, timerStore.start);
  
  // Find the active entry (if any)
  const activeEntry = useMemo(() => entries.find((e) => e.active), [entries]);

  // Update timer store whenever timer state changes
  useEffect(() => {
    setTimerStore({ running: timer.running, start: timer.startIso, entryId: timerStore.entryId });
  }, [timer.running, timer.startIso, timerStore.entryId]);

  // Stop a running entry
  const stopEntry = (entryId: string) => {
    setEntries((es) => es.map((e) => {
      if (e.id === entryId) {
        // Calculate duration to add to the existing duration
        const additionalDuration = timer.running && timer.startIso 
          ? Date.now() - new Date(timer.startIso).getTime() 
          : 0;
        return { 
          ...e, 
          active: false, 
          duration: (e.duration || 0) + additionalDuration 
        };
      }
      return e;
    }));
  };

  // Start a new entry or resume an existing one
  const startNewEntry = (projectId: string, resumeId?: string) => {
    const now = new Date().toISOString();
    if (resumeId) {
      // Resume existing entry
      setEntries((es) => es.map((e) => 
        e.id === resumeId 
          ? { ...e, active: true }
          : e.active ? { ...e, active: false } : e
      ));
    } else {
      // Create new entry
      const id = uuid();
      const newEntry: TimeEntry = { 
        id, 
        projectId, 
        start: now, 
        duration: 0,
        active: true 
      };
      setEntries((es) => [
        ...es.map(e => e.active ? { ...e, active: false } : e),
        newEntry
      ]);
    }
    setTimerStore({ running: true, start: now, entryId: resumeId || null });
    timer.start();
  };

  // Toggle between starting and stopping the timer
  const toggleTimer = (projects: { id: string }[]) => {
    if (timer.running) {
      // stop current entry
      timer.stop();
      if (activeEntry) stopEntry(activeEntry.id);
      setTimerStore({ running: false, start: null, entryId: null });
    } else {
      // resume last paused entry if exists, else create on first project
      if (timerStore.entryId) {
        const entry = entries.find((e) => e.id === timerStore.entryId);
        if (entry) {
          startNewEntry(entry.projectId, entry.id);
        } else if (projects.length) {
          startNewEntry(projects[0].id);
        } else {
          alert('Create a project first');
        }
      } else {
        if (!projects.length) return alert('Create a project first');
        startNewEntry(projects[0].id);
      }
    }
  };

  // Delete an entry
  const deleteEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));
  
  // Change an entry's project
  const changeEntryProject = (id: string, pid: string) => 
    setEntries(entries.map((e) => (e.id === id ? { ...e, projectId: pid } : e)));
  
  // Edit an entry's note
  const editEntry = (entry: TimeEntry) => {
    const note = prompt('Edit note', entry.note || '');
    if (note === null) return;
    setEntries(entries.map((e) => (e.id === entry.id ? { ...e, note } : e)));
  };
  
  // Resume an entry
  const resumeEntry = (entry: TimeEntry) => {
    if (timer.running) toggleTimer([]); // pause current first
    startNewEntry(entry.projectId, entry.id);
  };

  return {
    entries,
    setEntries,
    activeEntry,
    timer,
    stopEntry,
    startNewEntry,
    toggleTimer,
    deleteEntry,
    changeEntryProject,
    editEntry,
    resumeEntry
  };
} 