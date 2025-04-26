import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TimeEntry, Project, Settings } from './types';
import TopBar from './components/TopBar';
import TrackTab from './components/TrackTab';
import { PresetRange, getRange } from './utils/dateRanges';

// ─── Timer Hook ─────────────────────────────────────────────────────────────

function useTimer(initialRunning: boolean, initialStart: string | null) {
  const [running, setRunning] = useState(initialRunning);
  const [startIso, setStartIso] = useState<string | null>(initialStart);
  // local tick so App re‑renders once a second, TrackTab (memo) stays put
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

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  // persistent data
  const [projects, setProjects] = useLocalStorage<Project[]>('harvest.projects', []);
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>('harvest.entries', []);
  const [settings, setSettings] = useLocalStorage<Settings>('harvest.settings', { weekEndsOn: 'sunday' });
  const [tab, setTab] = useState<'TRACK' | 'REPORTS' | 'SETTINGS' | 'BACKUP'>('TRACK');

  // active project: last‑used
  const activeProject = useMemo(() => {
    if (!projects.length) return null;
    if (projects.length === 1) return projects[0];
    return projects.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
  }, [projects]);

  // timer persistence
  const [timerStore, setTimerStore] = useLocalStorage<{ running: boolean; start: string | null; projectId: string | null }>(
    'harvest.timer',
    { running: false, start: null, projectId: null },
  );
  const timer = useTimer(timerStore.running, timerStore.start);

  useEffect(() => {
    setTimerStore({ running: timer.running, start: timer.startIso, projectId: timerStore.projectId });
  }, [timer.running, timer.startIso]);

  // ─── Timer toggle ─────────────────────────────────────────────────────────

  const toggleTimer = () => {
    if (!activeProject) return alert('Create a project first');

    if (timer.running) {
      timer.stop();
      setTimerStore((s) => ({ ...s, running: false }));
      const startDate = new Date(timer.startIso!);
      let endDate = new Date();
      // ensure >= 1 minute
      if (endDate.getTime() - startDate.getTime() < 60_000) {
        endDate = new Date(startDate.getTime() + 60_000);
      }
      setEntries((es) => [
        ...es,
        { id: uuid(), projectId: activeProject.id, start: startDate.toISOString(), end: endDate.toISOString() },
      ]);
      setProjects((ps) => ps.map((p) => (p.id === activeProject.id ? { ...p, updatedAt: new Date().toISOString() } : p)));
    } else {
      timer.start();
      setTimerStore({ running: true, start: new Date().toISOString(), projectId: activeProject.id });
    }
  };

  // ─── Project CRUD ─────────────────────────────────────────────────────────

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

  // ─── Entry helpers ────────────────────────────────────────────────────────

  const deleteEntry = (id: string) => setEntries(entries.filter((e) => e.id !== id));
  const changeEntryProject = (id: string, pid: string) => setEntries(entries.map((e) => (e.id === id ? { ...e, projectId: pid } : e)));
  const editEntry = (entry: TimeEntry) => {
    const note = prompt('Edit note', entry.note || '');
    if (note === null) return;
    setEntries(entries.map((e) => (e.id === entry.id ? { ...e, note } : e)));
  };

  // ─── ReportsTab ───────────────────────────────────────────────────────────

  const ReportsTab = () => {
    const [preset, setPreset] = useState<PresetRange>('THIS_WEEK');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [start, end] = getRange(preset, settings, { from, to });

    const filtered = entries.filter((e) => new Date(e.start) >= start && new Date(e.end) <= end);

    const totals = useMemo(() => {
      const m = new Map<string, number>();
      filtered.forEach((e) => {
        const h = (new Date(e.end).getTime() - new Date(e.start).getTime()) / 36e5;
        m.set(e.projectId, (m.get(e.projectId) || 0) + h);
      });
      return Array.from(m.entries());
    }, [filtered]);

    const pidToName = (pid: string) => projects.find((p) => p.id === pid)?.name || '???';

    return (
      <div className="card">
        <h3>Reports</h3>
        <select value={preset} onChange={(e) => setPreset(e.target.value as PresetRange)}>
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
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
        <table style={{ marginTop: '0.5rem' }}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            {totals.map(([pid, h]) => (
              <tr key={pid}>
                <td>{pidToName(pid)}</td>
                <td>{h.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <small>
          Period: {start.toLocaleDateString()} – {end.toLocaleDateString()} ({filtered.length} entries)
        </small>
      </div>
    );
  };

  // ─── SettingsTab ──────────────────────────────────────────────────────────

  const SettingsTab = () => (
    <div className="card">
      <h3>Settings</h3>
      <label>
        Week ends on:{' '}
        <select value={settings.weekEndsOn} onChange={(e) => setSettings({ weekEndsOn: e.target.value as Settings['weekEndsOn'] })}>
          <option value="sunday">Sunday</option>
          <option value="saturday">Saturday</option>
        </select>
      </label>
    </div>
  );

  // ─── BackupTab ────────────────────────────────────────────────────────────

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
      <div className="card">
        <h3>Backup</h3>
        <button onClick={download}>Download data</button>
        <input type="file" accept="application/json" onChange={restore} style={{ marginLeft: '1rem' }} />
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <TopBar
        tabs={[
          { id: 'TRACK', label: 'Time tracking' },
          { id: 'REPORTS', label: 'Reports' },
          { id: 'SETTINGS', label: 'Settings' },
          { id: 'BACKUP', label: 'Backup' },
        ]}
        current={tab}
        changeTab={(id) => setTab(id as any)}
        activeProject={activeProject}
        isRunning={timer.running}
        toggleTimer={toggleTimer}
        elapsedMs={timer.elapsedMs}
      />
      <main>
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
          />
        )}
        {tab === 'REPORTS' && <ReportsTab />}
        {tab === 'SETTINGS' && <SettingsTab />}
        {tab === 'BACKUP' && <BackupTab />}
      </main>
    </>
  );
}