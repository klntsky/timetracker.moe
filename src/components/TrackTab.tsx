import React, { useState } from 'react';
import { Project, TimeEntry, Settings } from '../types';

interface Props {
  projects: Project[];
  entries: TimeEntry[];
  settings: Settings;
  addProject: () => void;
  renameProject: (id: string) => void;
  deleteProject: (id: string) => void;
  deleteEntry: (id: string) => void;
  changeEntryProject: (id: string, pid: string) => void;
  editEntry: (entry: TimeEntry) => void;
}

function TrackTabComponent({
  projects,
  entries,
  settings,
  addProject,
  renameProject,
  deleteProject,
  deleteEntry,
  changeEntryProject,
  editEntry,
}: Props) {
  const [projectMenu, setProjectMenu] = useState<string | null>(null);
  const [entryMenu, setEntryMenu] = useState<string | null>(null);

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

  const getEntriesForProjectDay = (projId: string, d: Date) =>
    entries.filter((e) => e.projectId === projId && new Date(e.start) >= d && new Date(e.start) < new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));

  const formatHours = (entry: TimeEntry) => ((new Date(entry.end).getTime() - new Date(entry.start).getTime()) / 36e5).toFixed(2);

  return (
    <>
      <div className="week-grid">
        <div className="header" />
        {days.map((d) => (
          <div key={d.toDateString()} className="header">
            {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
          </div>
        ))}
        {projects.map((p) => (
          <React.Fragment key={p.id}>
            <div
              className="cell header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}
            >
              <span>{p.name}</span>
              <span className="dropdown-toggle" onClick={() => setProjectMenu(projectMenu === p.id ? null : p.id)}>▾</span>
              {projectMenu === p.id && (
                <div className="dropdown-menu" onMouseLeave={() => setProjectMenu(null)}>
                  <div onClick={() => { setProjectMenu(null); renameProject(p.id); }}>Edit</div>
                  <div onClick={() => { setProjectMenu(null); deleteProject(p.id); }}>Delete</div>
                </div>
              )}
            </div>
            {days.map((d) => (
              <div key={d.toDateString()} className="cell">
                {getEntriesForProjectDay(p.id, d).map((e) => (
                  <div key={e.id} style={{ position: 'relative' }}>
                    <span className="dropdown-toggle" onClick={() => setEntryMenu(entryMenu === e.id ? null : e.id)}>
                      ▾ {formatHours(e)}
                    </span>
                    {entryMenu === e.id && (
                      <div className="dropdown-menu" onMouseLeave={() => setEntryMenu(null)}>
                        <div onClick={() => { setEntryMenu(null); editEntry(e); }}>Edit</div>
                        <div onClick={() => { setEntryMenu(null); deleteEntry(e.id); }}>Delete</div>
                        <div>
                          Change project:
                          <select
                            value={e.projectId}
                            onChange={(ev) => { setEntryMenu(null); changeEntryProject(e.id, ev.target.value); }}
                          >
                            {projects.map((pr) => (
                              <option key={pr.id} value={pr.id}>{pr.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="card" style={{ marginTop: '1rem' }}>
        <button onClick={addProject}>+ Add project</button>
      </div>
    </>
  );
}

export default React.memo(TrackTabComponent);