import React, { createContext, useContext, ReactNode } from 'react';
import { Project } from '../types';
import { useProjects } from '../hooks/useProjects';
import { useEntryContext } from './EntryContext';

interface ProjectContextValue {
  projects: Project[];
  addProject: () => Project;
  renameProject: (id: number, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: number) => void;
  reorderProjects: (draggedId: number, targetId: number, insertAfter?: boolean) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { entries, setEntries } = useEntryContext();
  const projectsApi = useProjects(entries, setEntries);

  return <ProjectContext.Provider value={projectsApi}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}
