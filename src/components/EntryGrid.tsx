import React, { useMemo, useCallback } from 'react';
import EntryGridView from './EntryGridView';
import { Project, TimeEntry } from '../types';
import { useProjectContext } from '../contexts/ProjectContext';

// Keep the prop surface simplified now that project operations come from context
export interface EntryGridProps {
  days: Date[];
  entries: TimeEntry[];
  toggleTimer: () => void;
  addEntry?: (entry: TimeEntry) => void;
  resumeEntry: (entry: TimeEntry) => void;
  weekOffset: number;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;
  goToNextWeek: () => void;
}

const EntryGrid: React.FC<EntryGridProps> = (props) => {
  const entriesForDay = useCallback((projectId: number, day: Date) => {
    return props.entries.filter(
      (e: TimeEntry) =>
        e.projectId === projectId &&
        new Date(e.start) >= day &&
        new Date(e.start) < new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
    );
  }, [props.entries]);

  return (
    <EntryGridView
      {...props}
      entriesForDay={entriesForDay}
    />
  );
};

export default EntryGrid; 