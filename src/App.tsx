import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Settings } from './types';
import TopBar from './components/TopBar';
import TrackTab from './components/TrackTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import BackupTab from './components/BackupTab';
import { useTimeEntries } from './hooks/useTimeEntries';
import { useProjects } from './hooks/useProjects';

export default function App() {
  // settings state
  const [settings, setSettings] = useLocalStorage<Settings>('harvest.settings', { weekEndsOn: 'sunday' });
  
  // ui state
  const [tab, setTab] = useState<'TRACK' | 'REPORTS' | 'SETTINGS' | 'BACKUP'>('TRACK');

  // time entries management
  const {
    entries,
    setEntries,
    activeEntry,
    timer,
    toggleTimer,
    deleteEntry,
    changeEntryProject,
    editEntry,
    resumeEntry
  } = useTimeEntries();

  // projects management
  const {
    projects,
    addProject,
    renameProject,
    deleteProject
  } = useProjects(entries, setEntries);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <TopBar
        tabs={[{ id: 'TRACK', label: 'Time tracking' }, { id: 'REPORTS', label: 'Reports' }, { id: 'SETTINGS', label: 'Settings' }, { id: 'BACKUP', label: 'Backup' }]}
        current={tab}
        changeTab={(id) => setTab(id as any)}
        activeEntry={activeEntry ?? null}
        isRunning={timer.running}
        toggleTimer={() => toggleTimer(projects)}
        elapsedMs={timer.elapsedMs}
      />
      <main className="container-fluid p-3">
        {tab === 'TRACK' && (
          <TrackTab
            projects={projects}
            entries={entries}
            settings={settings}
            addProject={addProject}
            renameProject={renameProject}
            deleteProject={deleteProject}
            deleteEntry={deleteEntry}
            changeEntryProject={changeEntryProject}
            editEntry={editEntry}
            resumeEntry={resumeEntry}
            toggleTimer={() => toggleTimer(projects)}
          />
        )}
        {tab === 'REPORTS' && 
          <ReportsTab 
            projects={projects} 
            entries={entries} 
            settings={settings} 
            timerElapsedMs={timer.elapsedMs} 
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