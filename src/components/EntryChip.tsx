import React, { useState, useEffect, useRef } from 'react';
import { TimeEntry } from '../types';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import { useTimerContext } from '../contexts/TimerContext';
import { useEntryContext } from '../contexts/EntryContext';
import { useProjectContext } from '../contexts/ProjectContext';
import { projectExists } from '../utils/stateUtils';
import Dropdown from './Dropdown';
import TimeEditor from './TimeEditor';
import CommentEditor from './CommentEditor';
import '../styles/EntryGrid.css';

interface EntryChipProps {
  entry: TimeEntry;
  toggleTimer: () => void;
  resumeEntry: (entry: TimeEntry) => void;
  autoEdit?: boolean;
}

const EntryChip: React.FC<EntryChipProps> = ({
  entry,
  toggleTimer,
  resumeEntry,
  autoEdit = false,
}) => {
  const [editingTime, setEditingTime] = useState(autoEdit);
  const [commentEditorPos, setCommentEditorPos] = useState<{ x: number; y: number } | null>(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Use contexts to get state and functions
  const { isRunning, elapsedMs } = useTimerContext();
  const { updateEntry, deleteEntry, changeEntryProject, lastUsedEntry } = useEntryContext();
  const { projects } = useProjectContext();

  // Compute resume visibility directly here
  const canResume = !isRunning && projectExists(projects, entry.projectId);

  // Only handle autoEdit once to avoid re-triggering mutations while data is still refreshing
  const autoEditHandledRef = useRef(false);

  useEffect(() => {
    if (autoEdit && !autoEditHandledRef.current) {
      autoEditHandledRef.current = true;
      setEditingTime(true);
      if (typeof updateEntry === 'function') {
        updateEntry(entry.id, { autoEdit: false });
      }
    }
  }, [autoEdit, entry.id, updateEntry]);

  const handleTimeSave = (newDuration: number) => {
    if (typeof updateEntry === 'function') {
      updateEntry(entry.id, { duration: newDuration, autoEdit: false });
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

  const effectiveDuration = entry.active ? entry.duration + elapsedMs : entry.duration;

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
          <TimeEditor
            duration={entry.duration}
            onSave={handleTimeSave}
            onCancel={() => setEditingTime(false)}
          />
        </div>
      ) : (
        <div className="flex-grow-1 d-flex align-items-center gap-1">
          {/* Time display */}
          <span
            title={formatTimeHHMMSS(effectiveDuration)}
            className="time-display"
            onClick={() => {
              if (!entry.active) {
                setEditingTime(true);
                // Clear autoEdit flag when manually clicking to edit
                if (entry.autoEdit && typeof updateEntry === 'function') {
                  updateEntry(entry.id, { autoEdit: false });
                }
              }
            }}
            style={{ cursor: entry.active ? 'default' : 'pointer' }}
          >
            <span className="time-text">{formatTimeHHMM(effectiveDuration)}</span>
            <div className="time-display-right">
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
              ) : canResume ? (
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

          {/* Comment display */}
          <span
            className="comment-display"
            title={entry.note || 'Add comment'}
            onClick={(evt) => {
              evt.stopPropagation();
              openCommentEditor(evt);
            }}
            style={{ cursor: 'pointer', flex: 1 }}
          >
            <span className="comment-text">{entry.note || ''}</span>
          </span>
        </div>
      )}

      {/* Dropdown */}
      <Dropdown
        isOpen={dropdownOpen}
        onOpenChange={setDropdownOpen}
        trigger={
          <button className="ellipsis-btn">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        }
      >
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
