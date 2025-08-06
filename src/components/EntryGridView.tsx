import React, { useMemo, useCallback } from 'react';
import TimeGridHeader from './TimeGridHeader';
import ProjectRow from './ProjectRow';
import { Project, TimeEntry } from '../types';
import { useDragReorder } from '../hooks/useDragReorder';
import { useEntryContext } from '../contexts/EntryContext';

import '../styles/EntryGrid.css';
import '../styles/dragAndDrop.css';

interface EntryGridViewProps {
  days: Date[];
  projects: Project[];
  renameProject: (id: number, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: number) => void;
  toggleTimer: () => void;
  addEntry?: (projectId: number, duration: number, note?: string, start?: string) => TimeEntry;
  resumeEntry: (entry: TimeEntry) => void;
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
  toggleTimer,
  addEntry,
  resumeEntry,
  weekOffset,
  goToPreviousWeek,
  goToCurrentWeek,
  goToNextWeek,
  entriesForDay,
  reorderProjects,
}: EntryGridViewProps) => {
  // Use entry context for updateEntry
  const { updateEntry } = useEntryContext();

  // Setup drag and drop functionality
  const { handleDragStart, getDropZoneState } = useDragReorder(
    projects,
    reorderProjects || (() => {})
  );

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
          addNewEntry={addNewEntry}
          toggleTimer={toggleTimer}
          resumeEntry={resumeEntry}
          onDragStart={handleDragStart(project.id)}
          dropZoneState={getDropZoneState(project.id)}
        />
      ))}
    </>
  );
};

export default EntryGridView;