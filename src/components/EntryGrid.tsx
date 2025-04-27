import React, { useState } from 'react';
import { Project, TimeEntry } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import EditableProjectName from './EditableProjectName';

interface EntryGridProps {
  days: Date[];
  projects: Project[];
  entries: TimeEntry[];
  renameProject: (id: string, newName: string) => void;
  deleteProject: (id: string) => void;
  deleteEntry: (id: string) => void;
  changeEntryProject: (id: string, pid: string) => void;
  editEntry: (entry: TimeEntry) => void;
  resumeEntry: (entry: TimeEntry) => void;
  toggleTimer: () => void;
  shouldShowResume?: boolean;
}

const EntryGrid: React.FC<EntryGridProps> = ({ 
  days,
  projects,
  entries,
  renameProject,
  deleteProject,
  deleteEntry,
  changeEntryProject,
  editEntry,
  resumeEntry,
  toggleTimer,
  shouldShowResume = true
}) => {
  const [projectMenu, setProjectMenu] = useState<string | null>(null);
  const [entryMenu, setEntryMenu] = useState<string | null>(null);
  
  const entriesForDay = (projId: string, d: Date): TimeEntry[] => {
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    
    return entries.filter(
      e => e.projectId === projId && 
           new Date(e.start).getTime() >= startOfDay.getTime() && 
           new Date(e.start).getTime() <= endOfDay.getTime()
    );
  };

  return (
    <>
      {days.map((d) => (
        <div key={d.toDateString()} className="header">
          {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
        </div>
      ))}
      
      {projects.map((p) => (
        <React.Fragment key={p.id}>
          <div className="cell header d-flex justify-content-between align-items-center">
            <EditableProjectName 
              name={p.name} 
              onRename={(newName) => renameProject(p.id, newName)} 
            />
            
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
                  deleteProject(p.id);
                }}
              >
                Delete
              </button>
            </Dropdown>
          </div>
          
          {days.map((d) => (
            <div key={d.toDateString()} className="cell">
              {entriesForDay(p.id, d).map((e: TimeEntry) => (
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
                    {shouldShowResume && !e.active && (
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
    </>
  );
};

export default EntryGrid; 