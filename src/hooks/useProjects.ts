import { useCallback } from 'react';
import { useSimpleStorage } from './useSimpleStorage';
import { Project, TimeEntry } from '../types';
import { generateId } from '../utils/idGenerator';
import { generateUniqueProjectName } from '../utils/projectUtils';
import { useTimerQuery } from './useTimerQuery';

export function useProjects(entries: TimeEntry[], setEntries: (entries: TimeEntry[]) => void) {
  const [projects, setProjects] = useSimpleStorage('timetracker.moe.projects', [] as Project[]);

  const {
    timer: { lastProjectId },
    resetTimer,
  } = useTimerQuery();

  // Add a new project with a unique name
  const addProject = useCallback(() => {
    const name = generateUniqueProjectName('New Project', projects);

    const newProject: Project = {
      id: generateId(),
      name,
      updatedAt: new Date().toISOString(),
    };

    setProjects([...projects, newProject]);
    return newProject;
  }, [projects, setProjects]);

  // Rename a project, ensuring unique names
  const renameProject = useCallback(
    (id: number, newName: string) => {
      const project = projects.find((p) => p.id === id);
      if (!project) return;
      if (project.name === newName) return;

      const otherProjects = projects.filter((p) => p.id !== id);
      const finalName = otherProjects.some((p) => p.name === newName)
        ? generateUniqueProjectName(newName, otherProjects)
        : newName;

      setProjects(
        projects.map((p) =>
          p.id === id ? { ...p, name: finalName, updatedAt: new Date().toISOString() } : p
        )
      );
    },
    [projects, setProjects]
  );

  // Update project details
  const updateProject = useCallback(
    (updatedProject: Project) => {
      const project = projects.find((p) => p.id === updatedProject.id);
      if (!project) return;

      setProjects(
        projects.map((p) =>
          p.id === updatedProject.id
            ? { ...updatedProject, updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    [projects, setProjects]
  );

  // Delete a project and all its entries
  const deleteProject = useCallback(
    (id: number) => {
      if (lastProjectId === id) {
        resetTimer();
      }

      setProjects(projects.filter((p) => p.id !== id));
      setEntries(entries.filter((e) => e.projectId !== id));
    },
    [projects, setProjects, entries, setEntries, lastProjectId, resetTimer]
  );

  // Reorder projects by moving one project to a new position
  const reorderProjects = useCallback(
    (draggedId: number, targetId: number, insertAfter = false) => {
      const draggedIndex = projects.findIndex((p) => p.id === draggedId);
      if (draggedIndex === -1) {
        return;
      }

      let targetIndex: number;
      if (targetId === -1) {
        targetIndex = projects.length;
      } else {
        targetIndex = projects.findIndex((p) => p.id === targetId);
        if (targetIndex === -1) {
          return;
        }
        if (insertAfter) targetIndex = targetIndex + 1;
      }

      if (draggedIndex === targetIndex || (draggedIndex + 1 === targetIndex && insertAfter)) {
        return;
      }

      const newProjects = [...projects];
      const [draggedProject] = newProjects.splice(draggedIndex, 1);
      const adjustedTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newProjects.splice(adjustedTargetIndex, 0, draggedProject);
      setProjects(newProjects);
    },
    [projects, setProjects]
  );

  return {
    projects,
    addProject,
    renameProject,
    updateProject,
    deleteProject,
    reorderProjects,
  };
}
