import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import './index.css';
import { useTheme } from './hooks/useTheme';
import { useProjects } from './hooks/useProjects';
import { useTimeEntries } from './hooks/useTimeEntries';
import { useSimpleStorage } from './hooks/useSimpleStorage';
import { useIdGeneratorSync } from './hooks/useIdGeneratorSync';
import { Settings } from './types';
import { TimerProvider } from './contexts/TimerContext';
import { EntryProvider } from './contexts/EntryContext';
import { ProjectProvider } from './contexts/ProjectContext';

import TopBar from './components/TopBar';
import TrackTab from './components/TrackTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import BackupTab from './components/BackupTab';

export default function App() {
  // Initialize theme immediately on app startup
  useTheme();

  // time entries management
  const { entries, setEntries, toggleTimer, canResumeTimerButton, resumeEntry, timer, elapsedMs } =
    useTimeEntries();

  const { projects, addProject, renameProject, updateProject, deleteProject, reorderProjects } =
    useProjects(entries, setEntries);
  useIdGeneratorSync(projects, entries); // Sync ID generator with loaded data

  // ─── Settings and Tab Management ──────────────────────────────────────────
  const [settings, setSettings] = useSimpleStorage('timetracker.moe.settings', {
    weekEndsOn: 'sunday',
  } as Settings);

  // ─── Current tab state ──────────────────────────────────────────────────
  const [tab, setTab] = useSimpleStorage(
    'timetracker.moe.currentTab',
    'TRACK' as 'TRACK' | 'REPORTS' | 'SETTINGS' | 'BACKUP'
  );

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

  // Check if timer button should be shown for the standalone timer
  const showTimerButton = canResumeTimerButton(projects);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <ProjectProvider
      projects={projects}
      addProject={addProject}
      renameProject={renameProject}
      updateProject={updateProject}
      deleteProject={deleteProject}
      reorderProjects={reorderProjects}
    >
      <TimerProvider isRunning={timer.running} projects={projects}>
        <EntryProvider>
          <div className="app">
            <TopBar
              tabs={tabs}
              current={tab}
              changeTab={(id: string) => setTab(id as 'TRACK' | 'REPORTS' | 'SETTINGS' | 'BACKUP')}
              isRunning={timer.running}
              toggleTimer={handleToggleTimer}
              elapsedMs={elapsedMs}
              showResumeButton={showTimerButton}
            />

            <main className="container-fluid mt-3">
              {tab === 'TRACK' && (
                <TrackTab
                  settings={settings}
                  resumeEntry={resumeEntry}
                  toggleTimer={handleToggleTimer}
                />
              )}

              {tab === 'REPORTS' && <ReportsTab settings={settings} timerElapsedMs={elapsedMs} />}

              {tab === 'SETTINGS' && <SettingsTab settings={settings} setSettings={setSettings} />}

              {tab === 'BACKUP' && <BackupTab />}
            </main>
          </div>
        </EntryProvider>
      </TimerProvider>
    </ProjectProvider>
  );
}
