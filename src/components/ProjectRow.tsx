import React, { useState } from 'react';
import { Project, TimeEntry } from '../types';
import ProjectHeader from './ProjectHeader';
import DayCell from './DayCell';
import BillableRateEditor from './BillableRateEditor';
import Popup from './Popup';

interface ProjectRowProps {
  project: Project;
  days: Date[];
  entriesForDay: (projectId: number, day: Date) => TimeEntry[];
  // Callbacks & data forwarded down
  allProjects: Project[];
  renameProject: (id: number, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: number) => void;
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, pid: number) => void;
  addNewEntry: (projectId: number, day: Date) => void;
  lastUsedEntry?: TimeEntry | null;
  shouldShowResume: boolean;
  toggleTimer: () => void;
  resumeEntry: (entry: TimeEntry) => void;
  updateEntry?: (entryId: number, updates: Partial<TimeEntry>) => void;
  autoEditEntryId: number | null;
  // Drag and drop props
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  dropZoneState?: {
    isDropTarget: boolean;
    insertPosition?: 'before' | 'after';
  };
}

const ProjectRow: React.FC<ProjectRowProps> = ({
  project,
  days,
  entriesForDay,
  allProjects,
  renameProject,
  updateProject,
  deleteProject,
  deleteEntry,
  changeEntryProject,
  addNewEntry,
  lastUsedEntry,
  shouldShowResume,
  toggleTimer,
  resumeEntry,
  updateEntry,
  autoEditEntryId,
  onDragStart,
  dropZoneState,
}) => {
  const [projectMenuOpenId, setProjectMenuOpenId] = useState<number | null>(null);
  const [editingBillableRate, setEditingBillableRate] = useState<Project | null>(null);

  const openBillableRateEditor = (p: Project) => setEditingBillableRate(p);
  const handleBillableRateSave = (updated: Project) => {
    updateProject(updated);
    setEditingBillableRate(null);
  };

  return (
    <>
      <ProjectHeader
        project={project}
        renameProject={renameProject}
        deleteProject={deleteProject}
        openBillableRateEditor={openBillableRateEditor}
        projectMenu={projectMenuOpenId}
        setProjectMenu={setProjectMenuOpenId}
        // Entry menu handled inside EntryChip now
        entryMenu={null}
        setEntryMenu={() => {}}
        onDragStart={onDragStart}
        dropZoneState={dropZoneState}
      />

      {days.map((day) => (
        <DayCell
          key={day.toDateString()}
          project={project}
          date={day}
          entries={entriesForDay(project.id, day)}
          allProjects={allProjects}
          addNewEntry={addNewEntry}
          lastUsedEntry={lastUsedEntry}
          shouldShowResume={shouldShowResume}
          toggleTimer={toggleTimer}
          resumeEntry={resumeEntry}
          updateEntry={updateEntry}
          deleteEntry={deleteEntry}
          changeEntryProject={changeEntryProject}
          autoEditEntryId={autoEditEntryId}
        />
      ))}

      {/* Billable Rate Editor Popup */}
      {editingBillableRate && (
        <Popup
          isOpen={!!editingBillableRate}
          onClose={() => setEditingBillableRate(null)}
          title={`${editingBillableRate.billableRate ? 'Edit' : 'Set'} Billable Rate - ${editingBillableRate.name}`}
        >
          <BillableRateEditor
            project={editingBillableRate}
            onSave={handleBillableRateSave}
            onCancel={() => setEditingBillableRate(null)}
          />
        </Popup>
      )}
    </>
  );
};

export default React.memo(ProjectRow); 