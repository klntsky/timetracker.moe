import { TimeEntry, Project } from '../types';

/**
 * State-related utility functions
 */

/**
 * Finds an entry by ID in an array of entries
 * @param entries Array of time entries to search
 * @param entryId ID of the entry to find
 * @returns The found entry or null
 */
export function findEntryById(entries: TimeEntry[], entryId: number | null): TimeEntry | null {
  if (!entryId) return null;
  return entries.find((e) => e.id === entryId) || null;
}

/**
 * Checks if a project exists in an array of projects
 * @param projects Array of projects to search
 * @param projectId ID of the project to find
 * @returns true if the project exists
 */
export function projectExists(projects: Project[], projectId: number | null): boolean {
  if (!projectId) return false;
  return projects.some((p) => p.id === projectId);
}

/**
 * Checks if an entry's project still exists
 * @param entry The entry to check
 * @param projects Array of projects to search
 * @returns true if the entry's project exists
 */
export function entryProjectExists(entry: TimeEntry | null, projects: Project[]): boolean {
  if (!entry) return false;
  return projectExists(projects, entry.projectId);
}

/**
 * Determines if the resume button should be shown based on state
 * @param isRunning Whether the timer is currently running
 * @param lastEntryId ID of the last used entry
 * @param entries Array of time entries
 * @param lastProjectId ID of the last used project
 * @param projects Array of projects
 * @returns boolean indicating if the resume button should be shown
 */
export function shouldShowResumeButton(
  isRunning: boolean,
  lastEntryId: number | null,
  entries: TimeEntry[],
  lastProjectId: number | null,
  projects: Project[]
): boolean {
  // Don't show resume if timer is running
  if (isRunning) {
    return false;
  }

  // Check if last entry exists and its project is valid
  const lastEntry = findEntryById(entries, lastEntryId);
  if (lastEntry && entryProjectExists(lastEntry, projects)) {
    return true;
  }

  // Check if last project exists
  if (projectExists(projects, lastProjectId)) {
    return true;
  }

  // Show if only one project exists
  if (projects.length === 1) {
    return true;
  }

  // Hide in all other cases
  return false;
}
