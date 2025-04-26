import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TimeEntry, Project, Settings } from './types';
import TopBar from './components/TopBar';
import TrackTab from './components/TrackTab';
import { PresetRange, getRange } from './utils/dateRanges';

// ─── Timer hook ────────────────────────────────────────────────────────────
function useTimer(initialRunning: boolean, initialStart: string | null) {
  const [running, setRunning] = useState(initialRunning);
  const [startIso, setStartIso] = useState<string | null>(initialStart);
  const [, force] = useState(0);

  useEffect(() => {
    if (!running) return;
    const int = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(int);
  }, [running]);

  const start = () => {
    setRunning(true);
    setStartIso(new Date().toISOString());
  };
  const stop = () => setRunning(false);

  const elapsedMs = running && startIso ? Date.now() - new Date(startIso).getTime() : 0;
  return { running, startIso, start, stop, elapsedMs } as const;
}

// ─── App component ─────────────────────────────────────────────────────────
export default function App() {
  // persistent stores
  const [projects, setProjects] = useLocalStorage<Project[]>('harvest.projects', []);
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>('harvest.entries', []);
  const [settings, setSettings] = useLocalStorage<Settings>('harvest.settings', { weekEndsOn: 'sunday' });

  // ui state
  const [tab, setTab] = useState<'TRACK' | 'REPORTS' | 'SETTINGS' | 'BACKUP'>('TRACK');

  // active (running) entry – one with active flag
  const activeEntry = useMemo(() => entries.find((e) => e.active), [entries]);

  // timer persistence
  const [timerStore, setTimerStore] = useLocalStorage<{
    running: boolean;
    start: string | null;
    entryId: string | null;
  }>('harvest.timer', { running: false, start: null, entryId: null });
  const timer = useTimer(timerStore.running, timerStore.start);

  useEffect(() => {
    setTimerStore({ running: timer.running, start: timer.startIso, entryId: timerStore.entryId });
  }, [timer.running, timer.startIso]);

  // ─── Timer control ───────────────────────────────────────────────────────
  const stopEntry = (entryId: string) => {
    setEntries((es) => es.map((e) => {
      if (e.id === entryId) {
        // Calculate duration to add to the existing duration
        const additionalDuration = timer.running && timer.startIso 
          ? Date.now() - new Date(timer.startIso).getTime() 
          : 0;
        return { 
          ...e, 
          active: false, 
          duration: (e.duration || 0) + additionalDuration 
        };
      }
      return e;
    }));
  };

  const startNewEntry = (projectId: string, resumeId?: string) => {
    const now = new Date().toISOString();
    if (resumeId) {
      // Resume existing entry
      setEntries((es) => es.map((e) => 
        e.id === resumeId 
          ? { ...e, active: true }
          : e.active ? { ...e, active: false } : e
      ));
    } else {
      // Create new entry
      const id = uuid();
      const newEntry: TimeEntry = { 
        id, 
        projectId, 
        start: now, 
        duration: 0,
        active: true 
      };
      setEntries((es) => [
        ...es.map(e => e.active ? { ...e, active: false } : e),
        newEntry
      ]);
    }
    setTimerStore({ running: true, start: now, entryId: resumeId || null });
    timer.start();
  };

  const toggleTimer = () => {
    if (timer.running) {
      // stop current entry
      timer.stop();
      if (activeEntry) stopEntry(activeEntry.id);
      setTimerStore({ running: false, start: null, entryId: null });
    } else {
      // resume last paused entry if exists, else create on first project
      if (timerStore.entryId) {
        const entry = entries.find((e) => e.id === timerStore.entryId);
        if (entry) {
          startNewEntry(entry.projectId, entry.id);
        } else if (projects.length) {
          startNewEntry(projects[0].id);
        } else {
          alert('Create a project first');
        }
      } else {
        if (!projects.length) return alert('Create a project first');
        startNewEntry(projects[0].id);
      }
    }
  };

  // ─── Project helpers ─────────────────────────────────────────────────────
  const addProject = () => {
    const name = prompt('Project name?');
    if (!name) return;
    setProjects([...projects, { id: uuid(), name, updatedAt: new Date().toISOString() }]);
  };
  const renameProject = (id: string) => {
    const name = prompt('New name?');
    if (!name) return;
    setProjects(projects.map((p) => (p.id === id ? { ...p, name } : p)));
  };
  const deleteProject = (id: string) => {
    if (!confirm('Delete project and its entries?')) return;
    setProjects(projects.filter((p) => p.id !== id));
    setEntries(entries.filter((e) => e.projectId !== id));
  };

  // ─── Entry helpers for TrackTab ─────────────────────────────────────────--
  const deleteEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));
  const changeEntryProject = (id: string, pid: string) => setEntries(entries.map((e) => (e.id === id ? { ...e, projectId: pid } : e)));
  const editEntry = (entry: TimeEntry) => {
    const note = prompt('Edit note', entry.note || '');
    if (note === null) return;
    setEntries(entries.map((e) => (e.id === entry.id ? { ...e, note } : e)));
  };
  const resumeEntry = (entry: TimeEntry) => {
    if (timer.running) toggleTimer(); // pause current first
    startNewEntry(entry.projectId, entry.id);
  };

  // ─── Reports Tab ─────────────────────────────────────────────────────────
  const ReportsTab = () => {
    const [preset, setPreset] = useState<PresetRange>('CUSTOM');
    const defaultFrom = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().substring(0, 10);
    const defaultTo = new Date().toISOString().substring(0, 10);
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [startDate, endDate] = getRange(preset, settings, { from, to });

    const filtered = entries.filter((e) => {
      const entryDate = new Date(e.start);
      return entryDate >= startDate && entryDate <= endDate;
    });

    const totals = useMemo(() => {
      const m = new Map<string, number>();
      filtered.forEach((e) => {
        // For active entries, add current elapsed time
        const entryDuration = e.active 
          ? (e.duration || 0) + (timer.running ? timer.elapsedMs : 0)
          : e.duration || 0;
        
        const hours = entryDuration / 3600000; // Convert ms to hours
        m.set(e.projectId, (m.get(e.projectId) || 0) + hours);
      });
      return Array.from(m.entries());
    }, [filtered, timer.elapsedMs]);

    const pidToName = (pid: string) => projects.find((p) => p.id === pid)?.name || '???';

    return (
      <div className="card p-3 mt-3">
        <h3>Reports</h3>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select className="form-select w-auto" value={preset} onChange={(e) => setPreset(e.target.value as PresetRange)}>
            <option value="THIS_WEEK">This week</option>
            <option value="LAST_WEEK">Last week</option>
            <option value="TWO_WEEKS">Two weeks</option>
            <option value="LAST_TWO_WEEKS">Last two weeks</option>
            <option value="THIS_MONTH">This month</option>
            <option value="LAST_MONTH">Last month</option>
            <option value="CUSTOM">Custom</option>
          </select>
          {preset === 'CUSTOM' && (
            <>
              <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          )}
        </div>
        <table className="table table-sm mt-3">
          <thead>
            <tr><th>Project</th><th className="text-end">Hours</th></tr>
          </thead>
          <tbody>
            {totals.map(([pid, h]) => (
              <tr key={pid}><td>{pidToName(pid)}</td><td className="text-end">{h.toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <small>
          Period: {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()} ({filtered.length} entries)
        </small>
      </div>
    );
  };

  // ─── Settings Tab ────────────────────────────────────────────────────────
  const SettingsTab = () => (
    <div className="card p-3 mt-3">
      <h3>Settings</h3>
      <label className="form-label">
        Week ends on:
        <select className="form-select w-auto d-inline-block ms-2" value={settings.weekEndsOn} onChange={(e) => setSettings({ weekEndsOn: e.target.value as Settings['weekEndsOn'] })}>
          <option value="sunday">Sunday</option>
          <option value="saturday">Saturday</option>
        </select>
      </label>
    </div>
  );

  // ─── Backup Tab ─────────────────────────────────────────────────────────-
  const BackupTab = () => {
    const download = () => {
      const blob = new Blob([JSON.stringify(localStorage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `harvest-data-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const restore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v as string);
          window.location.reload();
        } catch {
          alert('Bad file');
        }
      };
      reader.readAsText(file);
    };

    return (
      <div className="card p-3 mt-3">
        <h3>Backup</h3>
        <button className="btn btn-outline-primary" onClick={download}>Download data</button>
        <input type="file" accept="application/json" onChange={restore} className="form-control d-inline-block w-auto ms-3" />
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <TopBar
        tabs={[{ id: 'TRACK', label: 'Time tracking' }, { id: 'REPORTS', label: 'Reports' }, { id: 'SETTINGS', label: 'Settings' }, { id: 'BACKUP', label: 'Backup' }]}
        current={tab}
        changeTab={(id) => setTab(id as any)}
        activeEntry={activeEntry ?? null}
        isRunning={timer.running}
        toggleTimer={toggleTimer}
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
          />
        )}
        {tab === 'REPORTS' && <ReportsTab />}
        {tab === 'SETTINGS' && <SettingsTab />}
        {tab === 'BACKUP' && <BackupTab />}
      </main>
    </>
  );
}