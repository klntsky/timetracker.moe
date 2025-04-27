import { Project } from '../types';

/**
 * Project-related utility functions
 */

/**
 * Generates a unique project name by incrementing the number suffix if needed
 * @param baseName The base name to start with (defaults to "New Project")
 * @param existingProjects Array of existing projects to check against
 * @returns A unique project name
 */
export function generateUniqueProjectName(
  baseName: string = 'New Project',
  existingProjects: Project[]
): string {
  // If no projects exist or the name is already unique, return it
  if (existingProjects.length === 0 || !existingProjects.some(p => p.name === baseName)) {
    return baseName;
  }

  // Check if the name already ends with a number (e.g. "Project 1")
  const match = baseName.match(/^(.+) (\d+)$/);
  
  if (match) {
    // If it already has a number suffix, try incrementing it
    const prefix = match[1];
    let num = parseInt(match[2], 10);
    let newName: string;
    
    // Keep incrementing the number until we find a unique name
    do {
      num++;
      newName = `${prefix} ${num}`;
    } while (existingProjects.some(p => p.name === newName));
    
    return newName;
  } else {
    // If it doesn't have a number suffix, add " 1"
    let num = 1;
    let newName = `${baseName} ${num}`;
    
    // Keep incrementing the number until we find a unique name
    while (existingProjects.some(p => p.name === newName)) {
      num++;
      newName = `${baseName} ${num}`;
    }
    
    return newName;
  }
} 