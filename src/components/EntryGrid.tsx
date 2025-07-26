import React, { useState, useRef, useEffect } from 'react';
import { Project, TimeEntry } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import EditableProjectName from './EditableProjectName';
import Popup from './Popup';
import BillableRateEditor from './BillableRateEditor';
import TimeEditor from './TimeEditor';
import TimeGridHeader from './TimeGridHeader';
import ProjectHeader from './ProjectHeader';
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
  toggleTimer: () => void;
  shouldShowResume?: boolean;
  addEntry?: (projectId: string, duration: number, note?: string, start?: string) => TimeEntry;
  lastUsedEntry?: TimeEntry | null;
  resumeEntry: (entry: TimeEntry) => void;
  updateEntry?: (entryId: string, updates: Partial<TimeEntry>) => void;
  weekOffset: number;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;
  goToNextWeek: () => void;
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
  toggleTimer,
  shouldShowResume = true,
  addEntry,
  lastUsedEntry,
  resumeEntry,
  updateEntry,
  weekOffset,
  goToPreviousWeek,
  goToCurrentWeek,
  goToNextWeek
}) => {
  const [projectMenu, setProjectMenu] = useState<number | null>(null);
  const [entryMenu, setEntryMenu] = useState<number | null>(null);
  const [editingBillableRate, setEditingBillableRate] = useState<Project | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<number | null>(null);
  
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

  const openBillableRateEditor = (project: Project) => {
    setEditingBillableRate(project);
  };

  const handleTimeUpdate = (entry: TimeEntry, newDuration: number) => {
    if (typeof updateEntry === 'function') {
      // Just update the duration without starting the timer
      updateEntry(entry.id, { duration: newDuration });
    } else {
      console.error('updateEntry function is not available');
    }
    
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
      {/* Header row with day names */}
      <TimeGridHeader 
        days={days} 
        weekOffset={weekOffset}
        goToPreviousWeek={goToPreviousWeek}
        goToCurrentWeek={goToCurrentWeek}
        goToNextWeek={goToNextWeek}
      />
      
      {/* Project rows */}
      {projects.map((p) => (
        <React.Fragment key={p.id}>
          {/* Project header cell */}
          <ProjectHeader 
            project={p}
            renameProject={renameProject}
            deleteProject={deleteProject}
            openBillableRateEditor={openBillableRateEditor}
            projectMenu={projectMenu}
            setProjectMenu={setProjectMenu}
            entryMenu={entryMenu}
            setEntryMenu={setEntryMenu}
          />
          
          {/* Day cells for this project */}
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
                  {/* Blue indicator dot for last used entry */}
                  {lastUsedEntry && e.id === lastUsedEntry.id && (
                    <div className="last-used-indicator" title="Last used time entry"></div>
                  )}
                  
                  {editingTimeId === e.id ? (
                    <div className="time-editor-container">
                      <TimeEditor
                        duration={e.duration}
                        onSave={(newDuration) => handleTimeUpdate(e, newDuration)}
                        onCancel={() => setEditingTimeId(null)}
                      />
                    </div>
                  ) : (
                    <span 
                      title={formatTimeHHMMSS(e.duration)}
                      className="time-display"
                      onClick={() => !e.active && setEditingTimeId(e.id)}
                      style={{ cursor: e.active ? 'default' : 'pointer' }}
                    >
                      <span className="time-text">{formatTimeHHMM(e.duration)}</span>
                      {e.active ? (
                        <button 
                          className="btn btn-sm btn-danger" 
                          title="Pause this entry"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            toggleTimer();
                          }}
                        >
                          <i className="fas fa-pause"></i>
                        </button>
                      ) : shouldShowResume ? (
                        <button 
                          className="btn btn-sm btn-success resume-button" 
                          title="Resume this entry"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            resumeEntry(e);
                          }}
                        >
                          <i className="fas fa-play"></i>
                        </button>
                      ) : (
                        <span className="pause-placeholder"></span>
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