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
  resumeEntry: (entry: TimeEntry) => void;
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
  resumeEntry,
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

  const entriesForDay = (projId: string, d: Date) =>
    entries.filter(
      (e) =>
        e.projectId === projId &&
        new Date(e.start) >= d &&
        new Date(e.start) < new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    );

  const formatHours = (entry: TimeEntry) => {
    // Convert duration from milliseconds to hours
    return (entry.duration / 3600000).toFixed(2);
  };

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
            <div className="cell header d-flex justify-content-between align-items-center">
              <span>{p.name}</span>
              <button className="ellipsis-btn" onClick={() => setProjectMenu(projectMenu === p.id ? null : p.id)}>
                <i className="fas fa-ellipsis-v"></i>
              </button>
              {projectMenu === p.id && (
                <div className="dropdown-menu show" style={{ left: 'auto', right: 0 }}>
                  <button className="dropdown-item" onClick={() => { setProjectMenu(null); renameProject(p.id); }}>Edit</button>
                  <button className="dropdown-item" onClick={() => { setProjectMenu(null); deleteProject(p.id); }}>Delete</button>
                </div>
              )}
            </div>
            {days.map((d) => (
              <div key={d.toDateString()} className="cell">
                {entriesForDay(p.id, d).map((e) => (
                  <div key={e.id} className={`d-flex justify-content-between align-items-center ${e.active ? 'active-entry' : ''}`}>
                    <span>{formatHours(e)}{e.active ? ' *' : ''}</span>
                    <button className="ellipsis-btn" onClick={() => setEntryMenu(entryMenu === e.id ? null : e.id)}>
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {entryMenu === e.id && (
                      <div className="dropdown-menu show" style={{ left: 'auto', right: 0 }}>
                        {!e.active && (
                          <button className="dropdown-item" onClick={() => { setEntryMenu(null); resumeEntry(e); }}>Resume</button>
                        )}
                        <button className="dropdown-item" onClick={() => { setEntryMenu(null); editEntry(e); }}>Edit</button>
                        <button className="dropdown-item" onClick={() => { setEntryMenu(null); deleteEntry(e.id); }}>Delete</button>
                        <div className="dropdown-item">
                          Change project:
                          <select
                            className="form-select form-select-sm mt-1"
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
      <button className="btn btn-outline-primary mt-3" onClick={addProject}>+ Add project</button>
    </>
  );
}

export default React.memo(TrackTabComponent);