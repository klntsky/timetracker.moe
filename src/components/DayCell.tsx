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
  toggleTimer: () => void;
  resumeEntry: (entry: TimeEntry) => void;
}

const DayCell: React.FC<DayCellProps> = ({
  project,
  date,
  entries,
  allProjects,
  addNewEntry,
  toggleTimer,
  resumeEntry,
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
          toggleTimer={toggleTimer}
          resumeEntry={resumeEntry}
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