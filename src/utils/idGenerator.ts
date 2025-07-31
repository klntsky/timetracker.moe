/**
 * Sequential ID generator module
 * Maintains a counter in localStorage and generates sequential IDs
 * This module is stateful and isolated from React
 */

import { readFromLocalStorage, writeToLocalStorage } from './localStorageUtils';
import { Project, TimeEntry } from '../types';

const ID_COUNTER_KEY = 'timetracker.moe.idCounter';

class IdGenerator {
  private counter: number;

  constructor() {
    // Load the counter from localStorage or start at 1
    this.counter = this.loadCounter();
    // Initial sync will be done externally when data is available
  }

  private loadCounter(): number {
    return readFromLocalStorage(ID_COUNTER_KEY, 1);
  }

  private saveCounter(): void {
    writeToLocalStorage(ID_COUNTER_KEY, this.counter);
  }

  /**
   * Syncs the counter with provided data to ensure no ID conflicts
   * @param projects Array of existing projects
   * @param entries Array of existing time entries
   */
  public syncWithData(projects: Project[], entries: TimeEntry[]): void {
    const highestId = this.findHighestIdInData(projects, entries);
    if (highestId >= this.counter) {
      this.counter = highestId + 1;
      this.saveCounter();
    }
  }

  /**
   * Finds the highest numeric ID in the provided data
   * @param projects Array of projects to scan
   * @param entries Array of entries to scan
   * @returns The highest numeric ID found
   */
  private findHighestIdInData(projects: Project[], entries: TimeEntry[]): number {
    let highest = 0;

    // Check projects
    for (const project of projects) {
      if (project.id > highest) {
        highest = project.id;
      }
    }

    // Check entries
    for (const entry of entries) {
      if (entry.id > highest) {
        highest = entry.id;
      }
    }

    return highest;
  }

  /**
   * Generate the next sequential ID
   * @returns A number containing the next sequential ID
   */
  public next(): number {
    const id = this.counter;
    this.counter++;
    this.saveCounter();
    return id;
  }

  /**
   * Get the current counter value without incrementing
   * @returns The current counter value
   */
  public current(): number {
    return this.counter;
  }

  /**
   * Reset the counter to a specific value
   * @param value The value to reset the counter to (default: 1)
   */
  public reset(value: number = 1): void {
    this.counter = value;
    this.saveCounter();
  }

  /**
   * Resync the counter with existing data
   * Public method to trigger a resync when needed
   * @param projects Array of existing projects
   * @param entries Array of existing time entries
   */
  public resync(projects: Project[], entries: TimeEntry[]): void {
    this.syncWithData(projects, entries);
  }
}

// Create and export a singleton instance
const idGenerator = new IdGenerator();

/**
 * Generate the next sequential ID
 * @returns A number containing the next sequential ID
 */
export function generateId(): number {
  return idGenerator.next();
}

/**
 * Get the current counter value without incrementing
 * @returns The current counter value
 */
export function getCurrentCounter(): number {
  return idGenerator.current();
}

/**
 * Reset the counter to a specific value
 * @param value The value to reset the counter to (default: 1)
 */
export function resetCounter(value: number = 1): void {
  idGenerator.reset(value);
}

/**
 * Resync the counter with existing data
 * Call this after importing backup data to prevent ID conflicts
 * @param projects Array of existing projects
 * @param entries Array of existing time entries
 */
export function resyncCounter(projects: Project[], entries: TimeEntry[]): void {
  idGenerator.resync(projects, entries);
} 