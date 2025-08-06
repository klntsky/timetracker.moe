import React, { useState } from 'react';
import { Project, TimeEntry, Settings } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import EditableProjectName from './EditableProjectName';
import './TrackTab.css';
import { isToday, getWeekDays } from '../utils/timeUtils';
import EntryGrid from './EntryGrid';
import { usePersistedState } from '../hooks/usePersistedState';
import { useEntryContext } from '../contexts/EntryContext';
import { useProjectContext } from '../contexts/ProjectContext';

interface Props {
  settings: Settings;
  resumeEntry: (entry: TimeEntry) => void;
  toggleTimer: () => void;
  addEntry?: (projectId: number, duration: number, note?: string, start?: string) => TimeEntry;
}

function TrackTabComponent({
  settings,
  resumeEntry,
  toggleTimer,
  addEntry,
}: Props) {
  const [weekOffset, setWeekOffset] = usePersistedState('timetracker.moe.weekOffset', 0); // 0 = current week, -1 = last week, 1 = next week

  // Get entries from context instead of props
  const { entries } = useEntryContext();
  
  // Get project operations from context instead of props
  const { projects, addProject, renameProject, updateProject, deleteProject, reorderProjects } = useProjectContext();

  const weekStartsOn = settings.weekEndsOn === 'sunday' ? 'sunday' : 'saturday';

  // Use the new utility function to get the days of the week
  const days = getWeekDays(weekOffset, weekStartsOn);

  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);

  const entriesForDay = (projId: number, d: Date) =>
    entries.filter(
      (e: TimeEntry) =>
        e.projectId === projId &&
        new Date(e.start) >= d &&
        new Date(e.start) < new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    );

  const handleRenameProject = (projectId: number, newName: string) => {
    renameProject(projectId, newName);
  };

  return (
    <>
      <div className="week-grid">
        <EntryGrid 
          days={days}
          entries={entries}
          resumeEntry={resumeEntry}
          toggleTimer={toggleTimer}
          addEntry={typeof addEntry === 'function' ? addEntry : undefined}
          weekOffset={weekOffset}
          goToPreviousWeek={goToPreviousWeek}
          goToCurrentWeek={goToCurrentWeek}
          goToNextWeek={goToNextWeek}
        />
      </div>
      <button className="btn btn-outline-primary mt-3" onClick={addProject}>+ Add project</button>
    </>
  );
}

export default React.memo(TrackTabComponent);