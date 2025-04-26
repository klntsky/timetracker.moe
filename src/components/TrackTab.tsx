import React, { useEffect, useRef, useState } from 'react';
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

function useOutsideClick(ref: React.RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref]);
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
  const projMenuRef = useRef<HTMLDivElement>(null);
  const entryMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(projMenuRef, () => setProjectMenu(null));
  useOutsideClick(entryMenuRef, () => setEntryMenu(null));

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

  const durationForEntry = (e: TimeEntry) => {
    const prev = e.previousMs || 0;
    const endTime = e.end ? new Date(e.end).getTime() : Date.now();
    const cur = endTime - new Date(e.start).getTime();
    const h = (prev + cur) / 36e5;
    return h.toFixed(2);
  };

  const addEntryToDay = (projId: string, day: Date) => {
    resumeEntry({
      id: crypto.randomUUID(),
      projectId: projId,
      start: new Date(day).toISOString(),
    } as TimeEntry);
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
                <div className="dropdown-menu show" ref={projMenuRef} style={{ left: 'auto', right: 0 }}>
                  <button className="dropdown-item" onClick={() => { setProjectMenu(null); renameProject(p.id); }}>
                    Rename
                  </button>
                  <button className="dropdown-item" onClick={() => { setProjectMenu(null); deleteProject(p.id); }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
            {days.map((d) => (
              <div key={d.toDateString()} className="cell">
                {entriesForDay(p.id, d).map((e) => (
                  <div key={e.id} className="d-flex justify-content-between align-items-center mb-1">
                    <button
                      className="btn btn-sm btn-outline-secondary me-1"
                      onClick={() => resumeEntry(e)}
                    >
                      <i className="fas fa-play"></i>
                    </button>
                    <span>{durationForEntry(e)}</span>
                    <button className="ellipsis-btn" onClick={() => setEntryMenu(entryMenu === e.id ? null : e.id)}>
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                    {entryMenu === e.id && (
                      <div className="dropdown-menu show" ref={entryMenuRef} style={{ left: 'auto', right: 0 }}>
                        <button className="dropdown-item" onClick={() => { setEntryMenu(null); resumeEntry(e); }}>
                          Resume
                        </button>
                        <button className="dropdown-item" onClick={() => { setEntryMenu(null); editEntry(e); }}>
                          Edit note
                        </button>
                        <button className="dropdown-item" onClick={() => { setEntryMenu(null); deleteEntry(e.id); }}>
                          Delete
                        </button>
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
                <button className="btn btn-sm btn-outline-primary w-100" onClick={() => addEntryToDay(p.id, d)}>
                  +
                </button>
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