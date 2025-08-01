import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Settings, Project, TimeEntry } from './types';
import TopBar from './components/TopBar';
import TrackTab from './components/TrackTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import BackupTab from './components/BackupTab';
import { useTimeEntries } from './hooks/useTimeEntries';
import { useProjects } from './hooks/useProjects';
import { generateUniqueProjectName } from './utils/projectUtils';
import { useTheme } from './hooks/useTheme';

export default function App() {
  // Initialize theme immediately on app startup
  useTheme();
  
  // settings state
  const [settings, setSettings] = useLocalStorage<Settings>('timetracker.moe.settings', { weekEndsOn: 'sunday' });
  
  // ui state
  const [tab, setTab] = useState<'TRACK' | 'REPORTS' | 'SETTINGS' | 'BACKUP'>('TRACK');

  // time entries management
  const {
    entries,
    setEntries,
    lastUsedEntry,
    timer,
    toggleTimer,
    deleteEntry,
    changeEntryProject,
    resumeEntry,
    elapsedMs,
    canResume,
    addEntry,
    updateEntry
  } = useTimeEntries();

  // projects management
  const {
    projects,
    addProject,
    renameProject,
    updateProject,
    deleteProject,
    reorderProjects
  } = useProjects(entries, setEntries);

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