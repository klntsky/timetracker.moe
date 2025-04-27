import React, { useState } from 'react';
import { Project, TimeEntry, Settings } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import WeekNavigation from './WeekNavigation';
import EditableProjectName from './EditableProjectName';
import './TrackTab.css';
import { isToday, getWeekDays } from '../utils/timeUtils';
import EntryGrid from './EntryGrid';

interface Props {
  projects: Project[];
  entries: TimeEntry[];
  settings: Settings;
  addProject: () => void;
  renameProject: (id: string, newName: string) => void;
  deleteProject: (id: string) => void;
  deleteEntry: (id: string) => void;
  changeEntryProject: (id: string, pid: string) => void;
  editEntry: (entry: TimeEntry) => void;
  resumeEntry: (entry: TimeEntry) => void;
  toggleTimer: () => void;
  shouldShowResume: boolean;
}

function TrackTabComponent({
  projects,
  entries,
  settings,
  addProject,
  renameProject,
  deleteProject,
  deleteEntry,
  changeEntryProject,
  editEntry,
  resumeEntry,
  toggleTimer,
  shouldShowResume
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, 1 = next week

  const weekStartsOn = settings.weekEndsOn === 'sunday' ? 'sunday' : 'saturday';

  // Use the new utility function to get the days of the week
  const days = getWeekDays(weekOffset, weekStartsOn);

  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);

  const entriesForDay = (projId: string, d: Date) =>
    entries.filter(
      (e: TimeEntry) =>
        e.projectId === projId &&
        new Date(e.start) >= d &&
        new Date(e.start) < new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    );

  const handleRenameProject = (projectId: string, newName: string) => {
    renameProject(projectId, newName);
  };

  return (
    <>
      <div className="week-grid">
        <WeekNavigation 
          weekOffset={weekOffset}
          goToPreviousWeek={goToPreviousWeek}
          goToCurrentWeek={goToCurrentWeek}
          goToNextWeek={goToNextWeek}
        />
        
        <EntryGrid 
          days={days}
          projects={projects}
          entries={entries}
          renameProject={renameProject}
          deleteProject={deleteProject}
          deleteEntry={deleteEntry}
          changeEntryProject={changeEntryProject}
          editEntry={editEntry}
          resumeEntry={resumeEntry}
          toggleTimer={toggleTimer}
          shouldShowResume={shouldShowResume}
        />
      </div>
      <button className="btn btn-outline-primary mt-3" onClick={addProject}>+ Add project</button>
    </>
  );
}

export default React.memo(TrackTabComponent);