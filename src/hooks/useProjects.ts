import { useCallback } from 'react';
import { Project, TimeEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { v4 as uuidv4 } from 'uuid';

export function useProjects(entries: TimeEntry[], setEntries: (entries: TimeEntry[]) => void) {
  // Store projects in localStorage
  const [projects, setProjects] = useLocalStorage<Project[]>('harnesstime.projects', []);

  // Add a new project
  const addProject = useCallback(() => {
    const newProject: Project = {
      id: uuidv4(),
      name: 'New Project',
      updatedAt: new Date().toISOString()
    };
    setProjects([...projects, newProject]);
  }, [projects, setProjects]);

  // Rename a project
  const renameProject = useCallback(
    (id: string) => {
      const project = projects.find((p) => p.id === id);
      if (!project) return;

      const newName = prompt('Project name:', project.name);
      if (!newName) return;

      setProjects(
        projects.map((p) => {
          if (p.id === id) {
            return { ...p, name: newName, updatedAt: new Date().toISOString() };
          }
          return p;
        }),
      );
    },
    [projects, setProjects],
  );

  // Delete a project and its time entries
  const deleteProject = useCallback(
    (id: string) => {
      const project = projects.find((p) => p.id === id);
      if (!project) return;

      const confirm = window.confirm(`Delete "${project.name}" and all its time entries?`);
      if (!confirm) return;

      setProjects(projects.filter((p) => p.id !== id));
      setEntries(entries.filter((e) => e.projectId !== id));
    },
    [projects, setProjects, entries, setEntries],
  );

  return { projects, addProject, renameProject, deleteProject };
} 