/**
 * Sequential ID generator module
 * Maintains a counter in storage and generates sequential IDs
 * This module is stateful and isolated from React
 */

import { Project, TimeEntry } from '../types';
import { storage } from '../storage';

const ID_COUNTER_KEY = 'timetracker.moe.idCounter';

class IdGenerator {
  private counter: number = 1;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize asynchronously
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await storage.get<number>(ID_COUNTER_KEY);
      if (stored !== null) {
        this.counter = stored;
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ID generator:', error);
      this.initialized = true; // Continue with default value
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) {
      await this.initPromise;
    } else {
      await this.initialize();
    }
  }

  private async saveCounter(): Promise<void> {
    try {
      await storage.set(ID_COUNTER_KEY, this.counter);
    } catch (error) {
      console.error('Failed to save ID counter:', error);
    }
  }

  /**
   * Syncs the counter with provided data to ensure no ID conflicts
   * @param projects Array of existing projects
   * @param entries Array of existing time entries
   */
  public async syncWithData(projects: Project[], entries: TimeEntry[]): Promise<void> {
    await this.ensureInitialized();
    const highestId = this.findHighestIdInData(projects, entries);
    if (highestId >= this.counter) {
      this.counter = highestId + 1;
      await this.saveCounter();
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
   * NOTE: This is synchronous for backward compatibility, but may use stale counter
   * if called before initialization completes. In practice, this is fine because
   * React components will have loaded data first.
   * @returns A number containing the next sequential ID
   */
  public next(): number {
    const id = this.counter;
    this.counter++;
    // Save asynchronously - don't block ID generation
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
  public async reset(value: number = 1): Promise<void> {
    await this.ensureInitialized();
    this.counter = value;
    await this.saveCounter();
  }

  /**
   * Resync the counter with existing data
   * Public method to trigger a resync when needed
   * @param projects Array of existing projects
   * @param entries Array of existing time entries
   */
  public async resync(projects: Project[], entries: TimeEntry[]): Promise<void> {
    await this.syncWithData(projects, entries);
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
export async function resetCounter(value: number = 1): Promise<void> {
  return idGenerator.reset(value);
}

/**
 * Resync the counter with existing data
 * Call this after importing backup data to prevent ID conflicts
 * @param projects Array of existing projects
 * @param entries Array of existing time entries
 */
export async function resyncCounter(projects: Project[], entries: TimeEntry[]): Promise<void> {
  return idGenerator.resync(projects, entries);
} 