import React, { useMemo, useCallback } from 'react';
import TimeGridHeader from './TimeGridHeader';
import ProjectRow from './ProjectRow';
import { Project, TimeEntry } from '../types';
import { useDragReorder } from '../hooks/useDragReorder';
import { useEntryContext } from '../contexts/EntryContext';
import { useProjectContext } from '../contexts/ProjectContext';
import { generateId } from '../utils/idGenerator';

import '../styles/EntryGrid.css';
import '../styles/dragAndDrop.css';

interface EntryGridViewProps {
  days: Date[];
  toggleTimer: () => void;
  addEntry?: (entry: TimeEntry) => void;
  resumeEntry: (entry: TimeEntry) => void;
  weekOffset: number;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;
  goToNextWeek: () => void;
  entriesForDay: (projectId: number, day: Date) => TimeEntry[];
}

const EntryGridView: React.FC<EntryGridViewProps> = ({
  days,
  toggleTimer,
  addEntry,
  resumeEntry,
  weekOffset,
  goToPreviousWeek,
  goToCurrentWeek,
  goToNextWeek,
  entriesForDay,
}: EntryGridViewProps) => {
  // Use entry context for updateEntry
  const { updateEntry } = useEntryContext();
  
  const { projects, renameProject, updateProject, deleteProject, reorderProjects } = useProjectContext();

  // Setup drag and drop functionality
  const { handleDragStart, getDropZoneState } = useDragReorder(
    projects,
    reorderProjects || (() => {})
  );

  const addNewEntry = (projectId: number, day: Date) => {
    if (!addEntry) return;
    const entryDate = new Date(day);
    const now = new Date();
    entryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    
    // Create new entry with proper ID generation
    const newEntry: TimeEntry = {
      id: generateId(),
      projectId,
      start: entryDate.toISOString(),
      duration: 0,
      note: '',
      autoEdit: true
    };
    
    addEntry(newEntry);
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