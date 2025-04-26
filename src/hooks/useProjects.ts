import { v4 as uuid } from 'uuid';
import { useLocalStorage } from './useLocalStorage';
import { Project, TimeEntry } from '../types';

export function useProjects(
  entries: TimeEntry[],
  setEntries: React.Dispatch<React.SetStateAction<TimeEntry[]>>
) {
  const [projects, setProjects] = useLocalStorage<Project[]>('harvest.projects', []);

  const addProject = () => {
    const name = prompt('Project name?');
    if (!name) return;
    setProjects([...projects, { id: uuid(), name, updatedAt: new Date().toISOString() }]);
  };

  const renameProject = (id: string) => {
    const name = prompt('New name?');
    if (!name) return;
    setProjects(projects.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const deleteProject = (id: string) => {
    if (!confirm('Delete project and its entries?')) return;
    setProjects(projects.filter((p) => p.id !== id));
    setEntries(entries.filter((e) => e.projectId !== id));
  };

  return {
    projects,
    addProject,
    renameProject,
    deleteProject
  };
} 