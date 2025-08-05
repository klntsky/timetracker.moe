import React from 'react';
import { Project, TimeEntry } from '../types';
import TimeGridHeader from './TimeGridHeader';
import ProjectRow from './ProjectRow';
import { useDragReorder } from '../hooks/useDragReorder';

import '../styles/EntryGrid.css';
import '../styles/dragAndDrop.css';

interface EntryGridViewProps {
  days: Date[];
  projects: Project[];
  renameProject: (id: number, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: number) => void;
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, pid: number) => void;
  toggleTimer: () => void;
  addEntry?: (projectId: number, duration: number, note?: string, start?: string) => TimeEntry;
  lastUsedEntry?: TimeEntry | null;
  resumeEntry: (entry: TimeEntry) => void;
  updateEntry?: (entryId: number, updates: Partial<TimeEntry>) => void;
  weekOffset: number;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;
  goToNextWeek: () => void;
  entriesForDay: (projectId: number, day: Date) => TimeEntry[];
  reorderProjects?: (draggedId: number, targetId: number, insertAfter?: boolean) => void;
}

const EntryGridView: React.FC<EntryGridViewProps> = ({
  days,
  projects,
  renameProject,
  updateProject,
  deleteProject,
  deleteEntry,
  changeEntryProject,
  toggleTimer,
  addEntry,
  lastUsedEntry,
  resumeEntry,
  updateEntry,
  weekOffset,
  goToPreviousWeek,
  goToCurrentWeek,
  goToNextWeek,
  entriesForDay,
  reorderProjects,
}: EntryGridViewProps) => {
  // Setup drag and drop functionality
  const { handleDragStart, getDropZoneState } = useDragReorder(
    projects,
    reorderProjects || (() => {})
  );

  // Helper to add new entry delegated down to DayCell
  const addNewEntry = (projectId: number, day: Date) => {
    if (typeof addEntry !== 'function') return;
    const entryDate = new Date(day);
    const now = new Date();
    entryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    const newEntry = addEntry(projectId, 0, '', entryDate.toISOString());
    // Set autoEdit flag on the newly created entry
    if (newEntry && updateEntry) {
      updateEntry(newEntry.id, { autoEdit: true });
    }
  };

  return (
    <>
      <TimeGridHeader
        days={days}
        weekOffset={weekOffset}
        goToPreviousWeek={goToPreviousWeek}
        goToCurrentWeek={goToCurrentWeek}
        goToNextWeek={goToNextWeek}
      />

      {projects.map((project) => (
        <ProjectRow
          key={project.id}
          project={project}
          days={days}
          entriesForDay={entriesForDay}
          allProjects={projects}
          renameProject={renameProject}
          updateProject={updateProject}
          deleteProject={deleteProject}
          deleteEntry={deleteEntry}
          changeEntryProject={changeEntryProject}
          addNewEntry={addNewEntry}
          lastUsedEntry={lastUsedEntry}
          toggleTimer={toggleTimer}
          resumeEntry={resumeEntry}
          updateEntry={updateEntry}
          onDragStart={handleDragStart(project.id)}
          dropZoneState={getDropZoneState(project.id)}
        />
      ))}
    </>
  );
};

export default EntryGridView;