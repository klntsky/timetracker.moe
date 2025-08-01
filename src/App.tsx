import React, { useEffect, useRef, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import './index.css';
import { useTheme } from './hooks/useTheme';
import { useProjects } from './hooks/useProjects';
import { useTimeEntries } from './hooks/useTimeEntries';
import { useSimpleStorage } from './hooks/useSimpleStorage';
import { useIdGeneratorSync } from './hooks/useIdGeneratorSync';
import { Settings, TimeEntry } from './types';

import TopBar from './components/TopBar';
import TrackTab from './components/TrackTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import BackupTab from './components/BackupTab';


export default function App() {
  // Initialize theme immediately on app startup
  useTheme();

  // time entries management
  const { entries, setEntries, addEntry: addEntryBase, updateEntry, deleteEntry, changeEntryProject, updateEntryDuration, newEntry, toggleTimer, canResume, resumeEntry, timer, lastUsedEntry, elapsedMs } = useTimeEntries();
  const { projects, addProject, renameProject, updateProject, deleteProject, reorderProjects } = useProjects(entries, setEntries);
  useIdGeneratorSync(projects, entries); // Sync ID generator with loaded data

  // Compatibility wrapper for addEntry to match the old interface
  const addEntry = useCallback((projectId: number, duration: number, note?: string, start?: string) => {
    const id = Math.max(0, ...entries.map(e => e.id)) + 1;
    const entry: TimeEntry = {
      id,
      projectId,
      start: start || new Date().toISOString(),
      duration,
      note,
    };
    addEntryBase(entry);
    return entry;
  }, [entries, addEntryBase]);

  // ─── Settings and Tab Management ──────────────────────────────────────────
  const [settings, setSettings] = useSimpleStorage('timetracker.moe.settings', { weekEndsOn: 'sunday' } as Settings);

  // ─── Current tab state ──────────────────────────────────────────────────
  const [tab, setTab] = useSimpleStorage('timetracker.moe.currentTab', 'TRACK' as 'TRACK' | 'REPORTS' | 'SETTINGS' | 'BACKUP');

  // Define tabs that appear in the UI
  const tabs = [
    { id: 'TRACK', label: 'Time' },
    { id: 'REPORTS', label: 'Reports' },
    { id: 'SETTINGS', label: 'Settings' },
    { id: 'BACKUP', label: 'Backup' },
  ];

  // Handle timer toggling
  const handleToggleTimer = () => {
    // If no projects exist but they try to toggle, create one
    if (projects.length === 0) {
      addProject();
      // Wait for the project to be created, then toggle the timer
      setTimeout(() => {
        toggleTimer(projects);
      }, 100);
    } else {
      // Always pass the projects array to toggleTimer
      toggleTimer(projects);
    }
  };

  // Check if resume button should be shown
  const shouldShowResume = canResume(projects);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <TopBar
        tabs={tabs}
        current={tab}
        changeTab={(id) => setTab(id as any)}
        lastUsedEntry={lastUsedEntry}
        isRunning={timer.running}
        toggleTimer={handleToggleTimer}
        elapsedMs={elapsedMs}
        showResumeButton={shouldShowResume}
      />
      <main className="container-fluid p-3">
        {tab === 'TRACK' && (
          <TrackTab
            projects={projects}
            entries={entries}
            settings={settings}
            addProject={addProject}
            renameProject={renameProject}
            updateProject={updateProject}
            deleteProject={deleteProject}
            deleteEntry={deleteEntry}
            changeEntryProject={changeEntryProject}
            resumeEntry={resumeEntry}
            toggleTimer={handleToggleTimer}
            shouldShowResume={shouldShowResume}
            addEntry={addEntry}
            lastUsedEntry={lastUsedEntry}
            updateEntry={updateEntry}
            reorderProjects={reorderProjects}
          />
        )}
        {tab === 'REPORTS' && 
          <ReportsTab 
            projects={projects} 
            entries={entries} 
            settings={settings} 
            timerElapsedMs={elapsedMs} 
          />
        }
        {tab === 'SETTINGS' && 
          <SettingsTab 
            settings={settings} 
            setSettings={setSettings} 
          />
        }
        {tab === 'BACKUP' && <BackupTab />}
      </main>
    </>
  );
}