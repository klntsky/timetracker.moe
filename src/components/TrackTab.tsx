import React, { useState } from 'react';
import { Project, TimeEntry, Settings } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import EditableProjectName from './EditableProjectName';
import './TrackTab.css';
import { isToday, getWeekDays } from '../utils/timeUtils';
import EntryGrid from './EntryGrid';

interface Props {
  projects: Project[];
  entries: TimeEntry[];
  settings: Settings;
  addProject: () => void;
  renameProject: (id: number, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: number) => void;
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, pid: number) => void;
  resumeEntry: (entry: TimeEntry) => void;
  toggleTimer: () => void;
  shouldShowResume: boolean;
  addEntry?: (projectId: number, duration: number, note?: string, start?: string) => TimeEntry;
  lastUsedEntry?: TimeEntry | null;
  updateEntry?: (entryId: number, updates: Partial<TimeEntry>) => void;
  reorderProjects: (draggedId: number, targetId: number, insertAfter?: boolean) => void;
}

function TrackTabComponent({
  projects,
  entries,
  settings,
  addProject,
  renameProject,
  updateProject,
  deleteProject,
  deleteEntry,
  changeEntryProject,
  resumeEntry,
  toggleTimer,
  shouldShowResume,
  addEntry,
  lastUsedEntry,
  updateEntry,
  reorderProjects
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, 1 = next week

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
          projects={projects}
          entries={entries}
          renameProject={renameProject}
          updateProject={updateProject}
          deleteProject={deleteProject}
          deleteEntry={deleteEntry}
          changeEntryProject={changeEntryProject}
          resumeEntry={resumeEntry}
          toggleTimer={toggleTimer}
          shouldShowResume={shouldShowResume}
          addEntry={typeof addEntry === 'function' ? addEntry : undefined}
          lastUsedEntry={lastUsedEntry}
          updateEntry={updateEntry}
          weekOffset={weekOffset}
          goToPreviousWeek={goToPreviousWeek}
          goToCurrentWeek={goToCurrentWeek}
          goToNextWeek={goToNextWeek}
          reorderProjects={reorderProjects}
        />
      </div>
      <button className="btn btn-outline-primary mt-3" onClick={addProject}>+ Add project</button>
    </>
  );
}

export default React.memo(TrackTabComponent);