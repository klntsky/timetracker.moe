import React, { useState } from 'react';
import { Project, TimeEntry, Settings } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import WeekNavigation from './WeekNavigation';
import './TrackTab.css';
import { isToday, getWeekDays } from '../utils/timeUtils';
import EntryGrid from './EntryGrid';

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
  shouldShowResume: boolean;
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
  shouldShowResume
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, 1 = next week

  const weekStartsOn = settings.weekEndsOn === 'sunday' ? 'sunday' : 'saturday';

  // Use the new utility function to get the days of the week
  const days = getWeekDays(weekOffset, weekStartsOn);

  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);

  const entriesForDay = (projId: string, d: Date) =>
    entries.filter(
      (e: TimeEntry) =>
        e.projectId === projId &&
        new Date(e.start) >= d &&
        new Date(e.start) < new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    );

  return (
    <>
      <div className="week-grid">
        <div className="header">
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
                isOpen={false}
                onOpenChange={() => {}}
                trigger={
                  <button className="ellipsis-btn">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                }
              >
                <button 
                  className="dropdown-item" 
                  onClick={() => renameProject(p.id)}
                >
                  Edit
                </button>
                <button 
                  className="dropdown-item" 
                  onClick={() => deleteProject(p.id)}
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
                      isOpen={false}
                      onOpenChange={() => {}}
                      trigger={
                        <button className="ellipsis-btn">
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                      }
                    >
                      {!e.active && (
                        <button 
                          className="dropdown-item" 
                          onClick={() => resumeEntry(e)}
                        >
                          Resume
                        </button>
                      )}
                      <button 
                        className="dropdown-item" 
                        onClick={() => editEntry(e)}
                      >
                        Edit
                      </button>
                      <button 
                        className="dropdown-item" 
                        onClick={() => deleteEntry(e.id)}
                      >
                        Delete
                      </button>
                      <div className="dropdown-item">
                        Change project:
                        <select
                          className="form-select form-select-sm mt-1"
                          value={e.projectId}
                          onChange={(ev) => changeEntryProject(e.id, ev.target.value)}
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