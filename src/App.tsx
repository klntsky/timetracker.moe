import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TimeEntry, Project, Settings } from './types';
import TopBar from './components/TopBar';
import { PresetRange, getRange } from './utils/dateRanges';

// ─── Helper hooks ────────────────────────────────────────────────────────────

function useTimer(initialRunning: boolean, initialStart: string | null) {
  const [running, setRunning] = useState(initialRunning);
  const [startIso, setStartIso] = useState<string | null>(initialStart);
  const [tick, setTick] = useState(0);

  // tick each second when running
  useEffect(() => {
    if (!running) return;
    const int = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(int);
  }, [running]);

  const start = () => {
    setRunning(true);
    setStartIso(new Date().toISOString());
  };

  const stop = () => {
    setRunning(false);
  };

  const elapsedMs = running && startIso ? Date.now() - new Date(startIso).getTime() : 0;
  return { running, startIso, start, stop, elapsedMs } as const;
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [projects, setProjects] = useLocalStorage<Project[]>('harvest.projects', []);
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>('harvest.entries', []);
  const [settings, setSettings] = useLocalStorage<Settings>('harvest.settings', { weekEndsOn: 'sunday' });
  const [tab, setTab] = useState<'TRACK' | 'REPORTS' | 'SETTINGS' | 'BACKUP'>('TRACK');

  // active project = last updated or single
  const activeProject = useMemo(() => {
    if (!projects.length) return null;
    if (projects.length === 1) return projects[0];
    return projects.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
  }, [projects]);

  // timer state stored in localStorage to survive reload
  const [timerStore, setTimerStore] = useLocalStorage<{ running: boolean; start: string | null; projectId: string | null }>(
    'harvest.timer',
    { running: false, start: null, projectId: null },
  );
  const timer = useTimer(timerStore.running, timerStore.start);

  useEffect(() => {
    setTimerStore({ running: timer.running, start: timer.startIso, projectId: timerStore.projectId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.running, timer.startIso]);

  const toggleTimer = () => {
    if (!activeProject) return alert('Create a project first');
    if (timer.running) {
      // stop & create entry
      timer.stop();
      setTimerStore((s) => ({ ...s, running: false }));
      setEntries([
        ...entries,
        {
          id: uuid(),
          projectId: activeProject.id,
          start: timer.startIso!,
          end: new Date().toISOString(),
        },
      ]);
      setProjects(projects.map((p) => (p.id === activeProject.id ? { ...p, updatedAt: new Date().toISOString() } : p)));
    } else {
      timer.start();
      setTimerStore({ running: true, start: new Date().toISOString(), projectId: activeProject.id });
    }
  };

  // ─── Project CRUD ──────────────────────────────────────────────────────────

  const addProject = () => {
    const name = prompt('Project name?');
    if (!name) return;
    const proj: Project = { id: uuid(), name, updatedAt: new Date().toISOString() };
    setProjects([...projects, proj]);
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

  // ─── UI fragments ─────────────────────────────────────────────────────────

  const TrackTab = () => {
    // build week grid for current week
    const now = new Date();
    const weekStart = (() => {
      const ws = new Date(now);
      const offset = settings.weekEndsOn === 'sunday' ? 1 : 0;
      const diff = (now.getDay() + 7 - offset) % 7;
      ws.setDate(now.getDate() - diff);
      ws.setHours(0, 0, 0, 0);
      return ws;
    })();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });

    const getEntriesForProjectDay = (projId: string, d: Date) => {
      return entries.filter((e) => {
        if (e.projectId !== projId) return false;
        const st = new Date(e.start);
        return st >= d && st < new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      });
    };

    const formatHours = (entry: TimeEntry) => {
      const h = (new Date(entry.end).getTime() - new Date(entry.start).getTime()) / 36e5;
      return h.toFixed(2);
    };

    return (
      <>
        <div className="card">
          <button onClick={addProject}>+ Add project</button>
        </div>
        <div className="week-grid">
          <div className="header" />
          {days.map((d) => (
            <div key={d.toDateString()} className="header">
              {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
            </div>
          ))}
          {projects.map((p) => (
            <React.Fragment key={p.id}>
              <div className="cell header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{p.name}</span>
                <span>
                  <button onClick={() => renameProject(p.id)}>✎</button>{' '}
                  <button onClick={() => deleteProject(p.id)}>🗑</button>
                </span>
              </div>
              {days.map((d) => (
                <div key={d.toDateString()} className="cell">
                  {getEntriesForProjectDay(p.id, d).map((e) => (
                    <div key={e.id}>{formatHours(e)}</div>
                  ))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </>
    );
  };

  const ReportsTab = () => {
    const [preset, setPreset] = useState<PresetRange>('THIS_WEEK');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [start, end] = getRange(preset, settings, { from, to });

    const filtered = entries.filter((e) => {
      return new Date(e.start) >= start && new Date(e.end) <= end;
    });

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

  const SettingsTab = () => (
    <div className="card">
      <h3>Settings</h3>
      <label>
        Week ends on:
        <select
          value={settings.weekEndsOn}
          onChange={(e) => setSettings({ weekEndsOn: e.target.value as Settings['weekEndsOn'] })}
        >
          <option value="sunday">Sunday</option>
          <option value="saturday">Saturday</option>
        </select>
      </label>
    </div>
  );

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
          for (const [k, v] of Object.entries(data)) {
            localStorage.setItem(k, v as string);
          }
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
        {tab === 'TRACK' && <TrackTab />}
        {tab === 'REPORTS' && <ReportsTab />}
        {tab === 'SETTINGS' && <SettingsTab />}
        {tab === 'BACKUP' && <BackupTab />}
      </main>
    </>
  );
}