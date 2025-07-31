/**
 * Shared localStorage utilities with Zod validation
 * Provides safe parsing and conversion between storage and app formats
 */

import { z } from 'zod';
import { 
  StorageTimeEntriesSchema, 
  StorageProjectsSchema, 
  StorageSettingsSchema,
  timeEntryFromStorage,
  timeEntryToStorage,
  projectFromStorage,
  projectToStorage,
  settingsFromStorage,
  settingsToStorage,
  type StorageTimeEntry,
  type StorageProject,
  type StorageSettings
} from '../schemas/storage';
import { TimeEntry, Project, Settings } from '../types';

/**
 * Safely read and parse data from localStorage with Zod validation
 * @param key The localStorage key
 * @param defaultValue Value to return if key doesn't exist or parsing fails
 * @returns Parsed data or default value
 */
export function readFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    
    const parsed = JSON.parse(raw);
    
    // Use Zod schemas for validation and conversion based on key
    switch (key) {
      case 'timetracker.moe.entries': {
        const validated = StorageTimeEntriesSchema.parse(parsed);
        return validated.map(timeEntryFromStorage) as T;
      }
      case 'timetracker.moe.projects': {
        const validated = StorageProjectsSchema.parse(parsed);
        return validated.map(projectFromStorage) as T;
      }
      case 'timetracker.moe.settings': {
        const validated = StorageSettingsSchema.parse(parsed);
        return settingsFromStorage(validated) as T;
      }
      default:
        // For other keys (like idCounter), just parse as-is
        return parsed as T;
    }
  } catch {
    return defaultValue;
  }
}

/**
 * Safely write data to localStorage with conversion to storage format
 * @param key The localStorage key
 * @param value The value to store
 * @returns true if successful, false otherwise
 */
export function writeToLocalStorage<T>(key: string, value: T): boolean {
  try {
    let storageValue: any = value;
    
    // Convert to storage format based on key
    switch (key) {
      case 'timetracker.moe.entries': {
        const entries = value as TimeEntry[];
        storageValue = entries.map(timeEntryToStorage);
        break;
      }
      case 'timetracker.moe.projects': {
        const projects = value as Project[];
        storageValue = projects.map(projectToStorage);
        break;
      }
      case 'timetracker.moe.settings': {
        const settings = value as Settings;
        storageValue = settingsToStorage(settings);
        break;
      }
      // For other keys (like idCounter), store as-is
    }
    
    localStorage.setItem(key, JSON.stringify(storageValue));
    return true;
  } catch {
    return false;
  }
} 