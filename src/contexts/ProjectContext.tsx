import React, { createContext, useContext, ReactNode } from 'react';
import { Project } from '../types';

interface ProjectContextValue {
  projects: Project[];
  addProject: () => Project;
  renameProject: (id: number, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: number) => void;
  reorderProjects: (draggedId: number, targetId: number, insertAfter?: boolean) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ 
  children, 
  projects,
  addProject,
  renameProject,
  updateProject,
  deleteProject,
  reorderProjects,
}: { 
  children: ReactNode;
  projects: Project[];
  addProject: () => Project;
  renameProject: (id: number, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: number) => void;
  reorderProjects: (draggedId: number, targetId: number, insertAfter?: boolean) => void;
}) {
  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      renameProject, 
      updateProject, 
      deleteProject, 
      reorderProjects 
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
} 