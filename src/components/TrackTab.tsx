import React, { useState, useMemo } from 'react';
import { Project, TimeEntry, Settings } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import WeekNavigation from './WeekNavigation';
import './TrackTab.css';

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
  toggleTimer: () => void;
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
  toggleTimer,
}: Props) {
  const [projectMenu, setProjectMenu] = useState<string | null>(null);
  const [entryMenu, setEntryMenu] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, 1 = next week

  // Get current date
  const now = new Date();
  
  // Calculate the start of the week with offset
  const weekStart = useMemo(() => {
    const ws = new Date(now);
    const offset = settings.weekEndsOn === 'sunday' ? 1 : 0;
    const diff = (ws.getDay() + 7 - offset) % 7;
    ws.setDate(ws.getDate() - diff + (weekOffset * 7)); // Apply week offset
    ws.setHours(0, 0, 0, 0);
    return ws;
  }, [settings.weekEndsOn, weekOffset, now]);
  
  // Generate the days of the week
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // Check if we're on the current week
  const isCurrentWeek = useMemo(() => {
    return weekOffset === 0;
  }, [weekOffset]);

  // Week navigation functions
  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);

  const entriesForDay = (projId: string, d: Date) =>
    entries.filter(
      (e) =>
        e.projectId === projId &&
        new Date(e.start) >= d &&
        new Date(e.start) < new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    );

  return (
    <>
      <div className="week-grid">
        <div className="header">
          {/* Week navigation component */}
          <WeekNavigation
            weekOffset={weekOffset}
            goToPreviousWeek={goToPreviousWeek}
            goToCurrentWeek={goToCurrentWeek}
            goToNextWeek={goToNextWeek}
          />
        </div>
        
        {days.map((d) => (
          <div key={d.toDateString()} className="header">
            {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
          </div>
        ))}
        
        {projects.map((p) => (
          <React.Fragment key={p.id}>
            <div className="cell header d-flex justify-content-between align-items-center">
              <span>{p.name}</span>
              
              <Dropdown 
                isOpen={projectMenu === p.id}
                onOpenChange={(isOpen) => {
                  setProjectMenu(isOpen ? p.id : null);
                  // Close entry menu when opening project menu
                  if (isOpen && entryMenu) setEntryMenu(null);
                }}
                trigger={
                  <button className="ellipsis-btn">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                }
              >
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setProjectMenu(null);
                    renameProject(p.id);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setProjectMenu(null);
                    deleteProject(p.id);
                  }}
                >
                  Delete
                </button>
              </Dropdown>
            </div>
            {days.map((d) => (
              <div key={d.toDateString()} className="cell">
                {entriesForDay(p.id, d).map((e) => (
                  <div key={e.id} className={`d-flex justify-content-between align-items-center ${e.active ? 'active-entry' : ''}`}>
                    <span 
                      title={formatTimeHHMMSS(e.duration)}
                      className="time-display"
                    >
                      {formatTimeHHMM(e.duration)}
                      {e.active && (
                        <button 
                          className="btn btn-sm btn-danger ms-2 py-0 px-1" 
                          title="Pause this entry"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            toggleTimer();
                          }}
                        >
                          <i className="fas fa-pause"></i>
                        </button>
                      )}
                    </span>
                    
                    <Dropdown
                      isOpen={entryMenu === e.id}
                      onOpenChange={(isOpen) => {
                        setEntryMenu(isOpen ? e.id : null);
                        // Close project menu when opening entry menu
                        if (isOpen && projectMenu) setProjectMenu(null);
                      }}
                      trigger={
                        <button className="ellipsis-btn">
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                      }
                    >
                      {!e.active && (
                        <button 
                          className="dropdown-item" 
                          onClick={() => {
                            setEntryMenu(null);
                            resumeEntry(e);
                          }}
                        >
                          Resume
                        </button>
                      )}
                      <button 
                        className="dropdown-item" 
                        onClick={() => {
                          setEntryMenu(null);
                          editEntry(e);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => {
                          setEntryMenu(null);
                          deleteEntry(e.id);
                        }}
                      >
                        Delete
                      </button>
                      <div className="dropdown-item">
                        Change project:
                        <select
                          className="form-select form-select-sm mt-1"
                          value={e.projectId}
                          onChange={(ev) => {
                            setEntryMenu(null);
                            changeEntryProject(e.id, ev.target.value);
                          }}
                        >
                          {projects.map((pr) => (
                            <option key={pr.id} value={pr.id}>{pr.name}</option>
                          ))}
                        </select>
                      </div>
                    </Dropdown>
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