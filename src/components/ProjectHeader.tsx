import React from 'react';
import { Project } from '../types';
import EditableProjectName from './EditableProjectName';
import Dropdown from './Dropdown';

interface ProjectHeaderProps {
  project: Project;
  renameProject: (id: string, newName: string) => void;
  deleteProject: (id: string) => void;
  openBillableRateEditor: (project: Project) => void;
  projectMenu: string | null;
  setProjectMenu: (id: string | null) => void;
  entryMenu: string | null;
  setEntryMenu: (id: string | null) => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  renameProject,
  deleteProject,
  openBillableRateEditor,
  projectMenu,
  setProjectMenu,
  entryMenu,
  setEntryMenu
}) => {
  return (
    <div className="cell header d-flex flex-column">
      <div className="d-flex justify-content-between align-items-center">
        <EditableProjectName 
          name={project.name} 
          onRename={(newName) => renameProject(project.id, newName)} 
        />
        
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