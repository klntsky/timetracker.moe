import { useCallback } from 'react';
import { TimeEntry, Project } from '../types';
import { match, P } from 'ts-pattern';
import { shouldShowResumeButton, findEntryById, entryProjectExists } from '../utils/stateUtils';
import { ensureArray } from '../utils/timeUtils';
import { generateId } from '../utils/idGenerator';
import { useEntriesQuery } from './useEntriesQuery';
import { useTimerQuery } from './useTimerQuery';

export function useTimeEntries() {
  const {
    entries,
    addEntry,
    updateEntry,
    deleteEntry: deleteEntryBase,
    changeEntryProject: changeEntryProjectBase,
    updateEntryDuration,
    setEntries,
  } = useEntriesQuery();

  const {
    timer: { running: isRunning, start, lastEntryId, lastProjectId },
    startTimer: startTimerBase,
    stopTimer: stopTimerBase,
    updateProjectId,
    getElapsedMs,
  } = useTimerQuery();

  // Create a new entry and start timer on it
  const newEntry = useCallback(
    (projectId: number) => {
      const id = generateId();
      const now = new Date();
      const newEntry: TimeEntry = {
        id,
        projectId,
        start: now.toISOString(),
        duration: 0,
        active: true,
      };

      addEntry(newEntry);
      startTimerBase(id, projectId);
    },
    [addEntry, startTimerBase]
  );

  // Start timer on an existing entry
  const startTimer = useCallback(
    (projectId: number, entryId?: number) => {
      if (entryId) {
        // Resume existing entry
        updateEntry(entryId, { active: true });
        startTimerBase(entryId, projectId);
      } else {
        // Create new entry
        newEntry(projectId);
      }
    },
    [updateEntry, startTimerBase, newEntry]
  );

  // Stop the active timer and update the entry
  const stopTimer = useCallback(() => {
    if (!isRunning || !start || !lastEntryId) return;

    // Calculate the time that has elapsed
    const now = new Date();
    const startTime = new Date(start);
    const elapsedMs = now.getTime() - startTime.getTime();

    // Update the entry that was being timed
    const entryExists = entries.some((e) => e.id === lastEntryId);
    if (entryExists) {
      // Update duration and set active to false
      updateEntryDuration(lastEntryId, elapsedMs);
      updateEntry(lastEntryId, { active: false });
    }

    // Stop the timer
    stopTimerBase();
  }, [isRunning, start, lastEntryId, entries, updateEntryDuration, updateEntry, stopTimerBase]);

  // Toggle timer (start/stop)
  const toggleTimer = useCallback(
    (projects: Project[] = []) => {
      if (isRunning) {
        stopTimer();
        return;
      }

      // Try to resume the previously active entry
      const timer = { running: isRunning, start, lastEntryId, lastProjectId };
      const existingEntry = findEntryById(entries, timer.lastEntryId);

      // Check if the existing entry's project still exists
      const validExistingEntry =
        existingEntry && entryProjectExists(existingEntry, projects) ? existingEntry : null;

      // Check if the last used project still exists
      const validLastProjectId =
        timer.lastProjectId && projects.some((p) => p.id === timer.lastProjectId)
          ? timer.lastProjectId
          : null;

      match({
        existingEntry: validExistingEntry,
        lastProjectId: validLastProjectId,
        projectsLength: projects.length,
        projects,
      })
        .with(
          {
            existingEntry: P.not(P.nullish),
          },
          ({ existingEntry }) => {
            // Case 1: Resume the previous entry (only if its project still exists)
            startTimer(existingEntry.projectId, existingEntry.id);
          }
        )
        .with(
          {
            existingEntry: P.nullish,
            lastProjectId: P.not(P.nullish),
          },
          ({ lastProjectId }) => {
            // Case 2: Start a new entry on the last used project (only if it still exists)
            startTimer(lastProjectId);
          }
        )
        .with(
          {
            existingEntry: P.nullish,
            projectsLength: 1,
          },
          ({ projects }) => {
            // Case 3: No previous entry or project, but there's exactly one project
            // Always start timer on the only project available
            startTimer(projects[0].id);
          }
        )
        .otherwise(() => {
          // If none of these conditions are met, the button should be hidden by canResume
        });
    },
    [isRunning, start, lastEntryId, lastProjectId, entries, stopTimer, startTimer]
  );

  // Check if Resume button should be shown (renamed for clarity)
  const canResumeTimerButton = useCallback(
    (projects: Project[] = []) => {
      return shouldShowResumeButton(
        isRunning,
        lastEntryId,
        entries,
        lastProjectId,
        ensureArray(projects)
      );
    },
    [isRunning, lastEntryId, lastProjectId, entries]
  );

  // Delete an entry with timer handling
  const deleteEntry = useCallback(
    (id: number) => {
      // If deleting the currently running entry, stop the timer
      if (isRunning && lastEntryId === id) {
        stopTimer();
      }

      deleteEntryBase(id);
    },
    [isRunning, lastEntryId, stopTimer, deleteEntryBase]
  );

  // Change the project of an entry
  const changeEntryProject = useCallback(
    (id: number, projectId: number) => {
      // If changing the last used entry's project, update the timer state
      if (lastEntryId === id) {
        updateProjectId(projectId);
      }

      changeEntryProjectBase(id, projectId);
    },
    [lastEntryId, updateProjectId, changeEntryProjectBase]
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
    [isRunning, stopTimer, startTimer]
  );

  // Get the last used entry if it still exists
  const lastUsedEntry = findEntryById(entries, lastEntryId);

  return {
    entries,
    setEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    changeEntryProject,
    updateEntryDuration,
    newEntry,
    toggleTimer,
    canResumeTimerButton,
    resumeEntry,
    timer: { running: isRunning, start, lastEntryId, lastProjectId },
    lastUsedEntry,
    elapsedMs: getElapsedMs(),
  };
}
