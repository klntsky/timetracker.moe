import React from 'react';
import { Project, TimeEntry } from '../types';
import EntryChip from './EntryChip';
import '../styles/EntryGrid.css';

interface DayCellProps {
  project: Project;
  date: Date;
  entries: TimeEntry[];
  allProjects: Project[];
  addNewEntry: (projectId: number, day: Date) => void;
  lastUsedEntry?: TimeEntry | null;
  toggleTimer: () => void;
  resumeEntry: (entry: TimeEntry) => void;
  updateEntry?: (entryId: number, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, pid: number) => void;
}

const DayCell: React.FC<DayCellProps> = ({
  project,
  date,
  entries,
  allProjects,
  addNewEntry,
  lastUsedEntry,
  toggleTimer,
  resumeEntry,
  updateEntry,
  deleteEntry,
  changeEntryProject,
}) => {
  return (
    <div
      key={date.toDateString()}
      className="cell day-cell"
      data-project-id={project.id}
      data-day={date.toDateString()}
    >
      {entries.map((e) => (
        <EntryChip
          key={e.id}
          entry={e}
          projects={allProjects}
          lastUsedEntry={lastUsedEntry}
          toggleTimer={toggleTimer}
          resumeEntry={resumeEntry}
          updateEntry={updateEntry}
          deleteEntry={deleteEntry}
          changeEntryProject={changeEntryProject}
          autoEdit={!!e.autoEdit}
        />
      ))}

      {/* Add entry button that appears on hover */}
      <button
        className="add-entry-button"
        onClick={() => addNewEntry(project.id, date)}
        title={`Add time entry to ${project.name} on ${date.toLocaleDateString()}`}
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default React.memo(DayCell); 