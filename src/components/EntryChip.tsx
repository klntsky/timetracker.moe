import React, { useState, useEffect } from 'react';
import { Project, TimeEntry } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import Dropdown from './Dropdown';
import TimeEditor from './TimeEditor';
import CommentEditor from './CommentEditor';
import '../styles/EntryGrid.css';

interface EntryChipProps {
  entry: TimeEntry;
  projects: Project[];
  lastUsedEntry?: TimeEntry | null;
  shouldShowResume: boolean;
  toggleTimer: () => void;
  resumeEntry: (entry: TimeEntry) => void;
  updateEntry?: (entryId: number, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: number) => void;
  changeEntryProject: (id: number, pid: number) => void;
  autoEdit?: boolean;
}

const EntryChip: React.FC<EntryChipProps> = ({
  entry,
  projects,
  lastUsedEntry,
  shouldShowResume,
  toggleTimer,
  resumeEntry,
  updateEntry,
  deleteEntry,
  changeEntryProject,
  autoEdit = false,
}) => {
  const [editingTime, setEditingTime] = useState(autoEdit);
  const [commentEditorPos, setCommentEditorPos] = useState<{ x: number; y: number } | null>(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // If autoEdit becomes true later, open editor
  useEffect(() => {
    if (autoEdit) {
      setEditingTime(true);
    }
  }, [autoEdit]);

  const handleTimeSave = (newDuration: number) => {
    if (typeof updateEntry === 'function') {
      updateEntry(entry.id, { duration: newDuration });
    }
    setEditingTime(false);
  };

  const handleCommentSave = (newComment: string) => {
    if (typeof updateEntry === 'function') {
      updateEntry(entry.id, { note: newComment });
    }
    // Do not close the editor here; let onCancel or overlay click handle it
  };

  const openCommentEditor = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const buttonX = rect.left + rect.width / 2;
    const buttonY = rect.top;

    const POPUP_WIDTH = 280;
    const POPUP_HEIGHT = 120;
    const margin = 10;

    let left = buttonX - POPUP_WIDTH / 2;
    let top = buttonY - POPUP_HEIGHT - margin;
    if (top < margin) top = buttonY + margin;
    if (left < margin) left = margin;
    if (left + POPUP_WIDTH > window.innerWidth - margin) {
      left = window.innerWidth - margin - POPUP_WIDTH;
    }

    setCommentEditorPos({ x: left, y: top });
    setIsCommentOpen(true);
  };

  return (
    <div
      className={`d-flex justify-content-between align-items-center ${entry.active ? 'active-entry' : ''} ${
        lastUsedEntry && entry.id === lastUsedEntry.id ? 'last-used-entry' : ''
      }`}
    >
      {/* Blue indicator dot */}
      {lastUsedEntry && entry.id === lastUsedEntry.id && (
        <div className="last-used-indicator" title="Last used time entry"></div>
      )}

      {/* Duration + note */}
      {editingTime ? (
        <div className="time-editor-container">
          <TimeEditor duration={entry.duration} onSave={handleTimeSave} onCancel={() => setEditingTime(false)} />
        </div>
      ) : (
        <span
          title={formatTimeHHMMSS(entry.duration)}
          className="time-display"
          onClick={() => !entry.active && setEditingTime(true)}
          style={{ cursor: entry.active ? 'default' : 'pointer' }}
        >
          <span className="time-text">{formatTimeHHMM(entry.duration)}</span>
          <div className="time-display-right">
            {entry.note && (
              <span className="comment-text" title={entry.note}>
                {entry.note}
              </span>
            )}
            <button
              className="time-display-button comment-edit-button"
              title="Edit comment"
              onClick={(evt) => {
                evt.stopPropagation();
                openCommentEditor(evt);
              }}
            >
              <i className="fas fa-pencil-alt"></i>
            </button>
            {entry.active ? (
              <button
                className="time-display-button btn btn-sm btn-danger"
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
                className="time-display-button btn btn-sm btn-success resume-button"
                title="Resume this entry"
                onClick={(evt) => {
                  evt.stopPropagation();
                  resumeEntry(entry);
                }}
              >
                <i className="fas fa-play"></i>
              </button>
            ) : (
              <span className="pause-placeholder"></span>
            )}
          </div>
        </span>
      )}

      {/* Dropdown */}
      <Dropdown isOpen={dropdownOpen} onOpenChange={setDropdownOpen} trigger={<button className="ellipsis-btn"><i className="fas fa-ellipsis-v"></i></button>}>
        <button
          className="dropdown-item"
          onClick={() => {
            setDropdownOpen(false);
            deleteEntry(entry.id);
          }}
        >
          Delete
        </button>
        <div className="dropdown-item">
          Change project:
          <select
            className="form-select form-select-sm mt-1"
            value={entry.projectId}
            onChange={(ev) => {
              setDropdownOpen(false);
              changeEntryProject(entry.id, Number(ev.target.value));
            }}
          >
            {projects.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name}
              </option>
            ))}
          </select>
        </div>
      </Dropdown>

      {/* Comment editor popup */}
      {isCommentOpen && commentEditorPos && (
        <CommentEditor
          initialComment={entry.note || ''}
          onSave={handleCommentSave}
          onCancel={() => setIsCommentOpen(false)}
          position={commentEditorPos}
        />
      )}
    </div>
  );
};

export default React.memo(EntryChip); 