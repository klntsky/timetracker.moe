import React from 'react';
import { resyncCounter } from '../utils/idGenerator';
import { readFromLocalStorage } from '../utils/localStorageUtils';
import { TimeEntry, Project } from '../types';

const BackupTab: React.FC = () => {
  const exportData = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('harnesstime.')) {
        data[key] = JSON.parse(localStorage.getItem(key) || '');
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `harness-time-data-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        for (const key in data) {
          localStorage.setItem(key, JSON.stringify(data[key]));
        }
        
        // Resync the ID counter to prevent conflicts with imported data
        // Read the newly imported data using our safe parsing utilities
        const projects = readFromLocalStorage<Project[]>('harnesstime.projects', []);
        const entries = readFromLocalStorage<TimeEntry[]>('harnesstime.entries', []);
        resyncCounter(projects, entries);
        
        alert('Data imported successfully. Please refresh the page.');
      } catch (err) {
        alert('Failed to import data. Please try again with a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="container mt-4">
      <h2>Backup & Restore</h2>
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Export Data</h5>
              <p className="card-text">
                Download all your data including projects, time entries, and settings.
              </p>
              <button className="btn btn-primary" onClick={exportData}>
                Export Data
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Import Data</h5>
              <p className="card-text">
                Restore your data from a previous backup file.
              </p>
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  accept=".json"
                  onChange={importData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupTab; 