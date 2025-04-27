import React, { useState } from 'react';
import { Project, TimeEntry } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';

interface EntryGridProps {
  days: Date[];
}

const EntryGrid: React.FC<EntryGridProps> = ({ days }) => {
  // We'll need to get these from parent component or context in a real implementation
  const [projectMenu, setProjectMenu] = useState<string | null>(null);
  const [entryMenu, setEntryMenu] = useState<string | null>(null);
  
  // In a production app, these would come from props or a context/store
  const projects: Project[] = [];
  const entries: TimeEntry[] = [];
  
  // These would be real functions in a production app
  const entriesForDay = (projId: string, d: Date): TimeEntry[] => [];
  const renameProject = (id: string) => {};
  const deleteProject = (id: string) => {};
  const editEntry = (entry: TimeEntry) => {};
  const deleteEntry = (id: string) => {};
  const resumeEntry = (entry: TimeEntry) => {};
  const changeEntryProject = (id: string, projectId: string) => {};
  const toggleTimer = () => {};

  return (
    <>
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
    </>
  );
};

export default EntryGrid; 