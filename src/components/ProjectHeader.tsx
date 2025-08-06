import React from 'react';
import { Project } from '../types';
import EditableProjectName from './EditableProjectName';
import Dropdown from './Dropdown';
import DragHandle from './DragHandle';
import { useProjectContext } from '../contexts/ProjectContext';

interface ProjectHeaderProps {
  project: Project;
  openBillableRateEditor: (project: Project) => void;
  projectMenu: number | null;
  setProjectMenu: (id: number | null) => void;
  entryMenu: number | null;
  setEntryMenu: (id: number | null) => void;
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  dropZoneState?: {
    isDropTarget: boolean;
    insertPosition?: 'before' | 'after';
  };
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  openBillableRateEditor,
  projectMenu,
  setProjectMenu,
  entryMenu,
  setEntryMenu,
  onDragStart,
  dropZoneState
}) => {
  const { renameProject, deleteProject } = useProjectContext();

  return (
    <div 
      className={`cell header d-flex flex-column project-header ${
        dropZoneState?.isDropTarget ? `drag-over-${dropZoneState.insertPosition}` : ''
      }`}
      data-project-id={project.id}
    >
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center flex-grow-1">
          {onDragStart && (
            <DragHandle onDragStart={onDragStart} />
          )}
          <EditableProjectName 
            name={project.name} 
            onRename={(newName) => renameProject(project.id, newName)} 
          />
        </div>
        
        <Dropdown 
          isOpen={projectMenu === project.id}
          onOpenChange={(isOpen) => {
            setProjectMenu(isOpen ? project.id : null);
            // Close entry menu when opening project menu
            if (isOpen && entryMenu) setEntryMenu(null);
          }}
          trigger={
            <button className="ellipsis-btn">
              <i className="fas fa-ellipsis-v"></i>
            </button>
          }
        >
          <button 
            className="dropdown-item" 
            onClick={() => {
              setProjectMenu(null);
              deleteProject(project.id);
            }}
          >
            Delete
          </button>
          <button 
            className="dropdown-item" 
            onClick={() => {
              setProjectMenu(null);
              openBillableRateEditor(project);
            }}
          >
            {project.billableRate ? 'Edit billable rate' : 'Set billable rate'}
          </button>
        </Dropdown>
      </div>
    </div>
  );
};

export default ProjectHeader; 