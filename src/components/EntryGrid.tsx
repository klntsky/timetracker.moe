import React, { useState, useRef, useEffect } from 'react';
import { Project, TimeEntry } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import EditableProjectName from './EditableProjectName';
import Popup from './Popup';
import BillableRateEditor from './BillableRateEditor';
import TimeEditor from './TimeEditor';
import '../styles/EntryGrid.css';

interface EntryGridProps {
  days: Date[];
  projects: Project[];
  entries: TimeEntry[];
  renameProject: (id: string, newName: string) => void;
  updateProject: (updatedProject: Project) => void;
  deleteProject: (id: string) => void;
  deleteEntry: (id: string) => void;
  changeEntryProject: (id: string, pid: string) => void;
  editEntry: (entry: TimeEntry) => void;
  resumeEntry: (entry: TimeEntry) => void;
  toggleTimer: () => void;
  shouldShowResume?: boolean;
  addEntry?: (projectId: string, duration: number, note?: string, start?: string) => TimeEntry;
  lastUsedEntry?: TimeEntry | null;
}

const EntryGrid: React.FC<EntryGridProps> = ({ 
  days,
  projects,
  entries,
  renameProject,
  updateProject,
  deleteProject,
  deleteEntry,
  changeEntryProject,
  editEntry,
  resumeEntry,
  toggleTimer,
  shouldShowResume = true,
  addEntry,
  lastUsedEntry
}) => {
  const [projectMenu, setProjectMenu] = useState<string | null>(null);
  const [entryMenu, setEntryMenu] = useState<string | null>(null);
  const [editingBillableRate, setEditingBillableRate] = useState<Project | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  
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

  const handleUpdateBillableRate = (updatedProject: Project) => {
    updateProject(updatedProject);
    setEditingBillableRate(null);
    setProjectMenu(null);
  };

  const handleTimeUpdate = (entry: TimeEntry, newDuration: number) => {
    editEntry({
      ...entry,
      duration: newDuration
    });
    setEditingTimeId(null);
  };

  const addNewEntry = (projectId: string, day: Date) => {
    if (typeof addEntry !== 'function') {
      console.error('addEntry function is not available');
      return;
    }

    try {
      // Create a new entry with the project ID and date
      const entryDate = new Date(day);
      const now = new Date();
      entryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      // Create a new entry with 0 duration and the current time (adjusted to the selected day)
      const newEntry = addEntry(projectId, 0, '', entryDate.toISOString());
      
      // Immediately set this entry for editing
      setTimeout(() => {
        setEditingTimeId(newEntry.id);
      }, 100);
    } catch (error) {
      console.error('Error adding entry:', error);
    }
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
          <div className="cell header d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center">
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
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setProjectMenu(null);
                    setEditingBillableRate(p);
                  }}
                >
                  {p.billableRate ? 'Edit billable rate' : 'Set billable rate'}
                </button>
              </Dropdown>
            </div>
          </div>
          
          {days.map((d) => (
            <div 
              key={d.toDateString()} 
              className="cell day-cell"
              data-project-id={p.id}
              data-day={d.toDateString()}
            >
              {entriesForDay(p.id, d).map((e: TimeEntry) => (
                <div 
                  key={e.id} 
                  className={`d-flex justify-content-between align-items-center 
                    ${e.active ? 'active-entry' : ''} 
                    ${lastUsedEntry && e.id === lastUsedEntry.id ? 'last-used-entry' : ''}
                  `}
                >
                  {editingTimeId === e.id ? (
                    <TimeEditor
                      duration={e.duration}
                      onSave={(newDuration) => handleTimeUpdate(e, newDuration)}
                      onCancel={() => setEditingTimeId(null)}
                    />
                  ) : (
                    <span 
                      title={formatTimeHHMMSS(e.duration)}
                      className="time-display"
                      onClick={() => !e.active && setEditingTimeId(e.id)}
                      style={{ cursor: e.active ? 'default' : 'pointer' }}
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
                  )}
                  
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
              
              {/* Add entry button that appears on hover */}
              <button 
                className="add-entry-button"
                onClick={() => addNewEntry(p.id, d)}
                title={`Add time entry to ${p.name} on ${d.toLocaleDateString()}`}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          ))}
        </React.Fragment>
      ))}

      {/* Billable Rate Editor Popup */}
      {editingBillableRate && (
        <Popup
          isOpen={!!editingBillableRate}
          onClose={() => setEditingBillableRate(null)}
          title={`${editingBillableRate.billableRate ? 'Edit' : 'Set'} Billable Rate - ${editingBillableRate.name}`}
        >
          <BillableRateEditor
            project={editingBillableRate}
            onSave={handleUpdateBillableRate}
            onCancel={() => setEditingBillableRate(null)}
          />
        </Popup>
      )}
    </>
  );
};

export default EntryGrid; 