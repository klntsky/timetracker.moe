import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import './index.css';
import { useTheme } from './hooks/useTheme';
import { useTimeEntries } from './hooks/useTimeEntries';
import { useSimpleStorage } from './hooks/useSimpleStorage';
import { useIdGeneratorSync } from './hooks/useIdGeneratorSync';
import { Settings } from './types';
import { TimerProvider } from './contexts/TimerContext';
import { EntryProvider, useEntryContext } from './contexts/EntryContext';
import { ProjectProvider, useProjectContext } from './contexts/ProjectContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TopBar from './components/TopBar';
import TrackTab from './components/TrackTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import BackupTab from './components/BackupTab';

const queryClient = new QueryClient();

function AppContent() {
  // Initialize theme immediately on app startup
  useTheme();

  // time entries & timer management
  const { toggleTimer, canResumeTimerButton, resumeEntry, timer, elapsedMs } = useTimeEntries();

  // projects & entries via context
  const { entries } = useEntryContext();
  const { projects, addProject } = useProjectContext();
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
    if (projects.length === 0) {
      addProject();
      setTimeout(() => {
        toggleTimer(projects);
      }, 100);
    } else {
      toggleTimer(projects);
    }
  };

  // Check if timer button should be shown for the standalone timer
  const showTimerButton = canResumeTimerButton(projects);

  return (
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
          <TrackTab settings={settings} resumeEntry={resumeEntry} toggleTimer={handleToggleTimer} />
        )}

        {tab === 'REPORTS' && <ReportsTab settings={settings} timerElapsedMs={elapsedMs} />}

        {tab === 'SETTINGS' && <SettingsTab settings={settings} setSettings={setSettings} />}

        {tab === 'BACKUP' && <BackupTab />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EntryProvider>
        <ProjectProvider>
          <TimerProvider>
            <AppContent />
          </TimerProvider>
        </ProjectProvider>
      </EntryProvider>
    </QueryClientProvider>
  );
}
