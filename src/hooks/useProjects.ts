import { useCallback } from 'react';
import { useSimpleStorage } from './useSimpleStorage';
import { Project, TimeEntry } from '../types';
import { generateId } from '../utils/idGenerator';
import { generateUniqueProjectName } from '../utils/projectUtils';
import { useTimerStore } from '../stores/timerStore';

export function useProjects(entries: TimeEntry[], setEntries: (entries: TimeEntry[]) => void) {
  const [projects, setProjects] = useSimpleStorage('timetracker.moe.projects', [] as Project[]);
  
  // Access timer store to check if we need to stop the timer
  const { running: isTimerRunning, lastProjectId, lastEntryId, stopTimer, setTimer } = useTimerStore();

  // Add a new project with a unique name
  const addProject = useCallback(() => {
    // Generate a unique project name
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
      // Find the project to rename
      const project = projects.find(p => p.id === id);
      if (!project) return;
      
      // If name isn't changing, do nothing
      if (project.name === newName) return;
      
      // Get other projects to check for name uniqueness
      const otherProjects = projects.filter(p => p.id !== id);
      
      // Generate a unique name if needed
      const finalName = otherProjects.some(p => p.name === newName)
        ? generateUniqueProjectName(newName, otherProjects)
        : newName;
      
      // Update the project
      setProjects(
        projects.map(p =>
          p.id === id
            ? { ...p, name: finalName, updatedAt: new Date().toISOString() }
            : p
        )
      );
    },
    [projects, setProjects]
  );

  // Update project details
  const updateProject = useCallback(
    (updatedProject: Project) => {
      // Find the project to update
      const project = projects.find(p => p.id === updatedProject.id);
      if (!project) return;
      
      // Update the project
      setProjects(
        projects.map(p =>
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
      // If the last used project is the one being deleted, clear the timer state completely
      if (lastProjectId === id) {
        // Clear all timer references since the project no longer exists
        setTimer({
          running: false,
          start: null,
          lastEntryId: null,
          lastProjectId: null,
        });
      } else if (isTimerRunning && lastProjectId === id) {
        // Fallback: if somehow the timer is running but lastProjectId doesn't match, just stop it
        stopTimer();
      }
      
      // Remove the project
      setProjects(projects.filter(p => p.id !== id));
      
      // Also remove all time entries associated with this project
      setEntries(entries.filter(e => e.projectId !== id));
    },
    [projects, setProjects, entries, setEntries, isTimerRunning, lastProjectId, lastEntryId, stopTimer, setTimer]
  );

  // Reorder projects by moving one project to a new position
  const reorderProjects = useCallback(
    (draggedId: number, targetId: number, insertAfter = false) => {
      const draggedIndex = projects.findIndex(p => p.id === draggedId);
      
      if (draggedIndex === -1) {
        return;
      }
      
      let targetIndex: number;
      
      // Special case: if targetId is -1, insert at the end
      if (targetId === -1) {
        targetIndex = projects.length;
      } else {
        targetIndex = projects.findIndex(p => p.id === targetId);
        if (targetIndex === -1) {
          return;
        }
        
        if (insertAfter) {
          targetIndex = targetIndex + 1;
        }
      }
      
      // Don't do anything if dropping in the same position
      if (draggedIndex === targetIndex || (draggedIndex + 1 === targetIndex && insertAfter)) {
        return;
      }
      
      const newProjects = [...projects];
      const [draggedProject] = newProjects.splice(draggedIndex, 1);
      
      // Adjust target index if we removed an item before it
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