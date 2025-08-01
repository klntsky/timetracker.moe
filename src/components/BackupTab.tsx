import React from 'react';
import { storage } from '../storage';
import { resyncCounter } from '../utils/idGenerator';
import { Project, TimeEntry } from '../types';

const BackupTab: React.FC = () => {
  const exportData = async () => {
    try {
      const data: Record<string, any> = {};
      
      // List of keys to export
      const keysToExport = [
        'timetracker.moe.entries',
        'timetracker.moe.projects',
        'timetracker.moe.settings',
        'timetracker.moe.timer',
        'timetracker.moe.theme',
        'timetracker.moe.idCounter',
        'timetracker.moe.currentTab',
        'timetracker.moe.reportPreset',
        'timetracker.moe.reportFromDate',
        'timetracker.moe.reportToDate',
        'timetracker.moe.weekOffset'
      ];
      
      // Export all relevant data using storage abstraction
      for (const key of keysToExport) {
        const value = await storage.get(key);
        if (value !== null) {
          data[key] = value;
        }
      }
      
      // Also check localStorage directly for any legacy data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('timetracker.moe.') && !keysToExport.includes(key)) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            // Skip invalid JSON
          }
        }
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `harness-time-data-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Import data using storage abstraction
        for (const key in data) {
          if (key.startsWith('timetracker.moe.')) {
            await storage.set(key, data[key]);
          }
        }
        
        // Resync the ID counter to prevent conflicts with imported data
        const projects = await storage.get<Project[]>('timetracker.moe.projects') || [];
        const entries = await storage.get<TimeEntry[]>('timetracker.moe.entries') || [];
        await resyncCounter(projects, entries);
        
        alert('Data imported successfully. Please refresh the page.');
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to import data. Please try again with a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <h2>Backup</h2>
      <div className="mb-3">
        <p>Export your data as a JSON file for backup or migration purposes.</p>
        <button className="btn btn-primary" onClick={exportData}>
          <i className="fas fa-download me-2"></i>
          Export Data
        </button>
      </div>
      <div>
        <p>Import data from a previously exported JSON file.</p>
        <input 
          type="file" 
          accept=".json" 
          onChange={importData} 
          className="form-control"
          style={{ maxWidth: '400px' }}
        />
        <small className="form-text text-muted">
          Note: Importing will merge with existing data. Duplicate IDs will be handled automatically.
        </small>
      </div>
    </>
  );
};

export default BackupTab; 