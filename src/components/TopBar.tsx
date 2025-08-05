// src/components/TopBar.tsx
import React from 'react';
import { TimeEntry } from '../types';
import clsx from 'clsx';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import './TopBar.css'; // We'll create this file next

interface Props {
  tabs: Array<{ id: string; label: string }>;
  current: string;
  changeTab: (id: string) => void;
  lastUsedEntry?: TimeEntry | null;
  isRunning: boolean;
  toggleTimer: () => void;
  elapsedMs: number;
  showResumeButton: boolean;
}

export default function TopBar({
  tabs,
  current,
  changeTab,
  lastUsedEntry,
  isRunning,
  toggleTimer,
  elapsedMs,
  showResumeButton
}: Props) {
  // Format time using our utility functions
  const displayTime = formatTimeHHMM(elapsedMs);
  const fullTime = formatTimeHHMMSS(elapsedMs);

  // Determine button state
  const canStart = showResumeButton || isRunning;
  const buttonTitle = isRunning 
    ? "Pause timer"
    : canStart 
      ? "Start/resume timer" 
      : "No recently active time entry - don't know what to resume";

  return (
    <header className="d-flex position-relative" style={{ minHeight: '60px' }}>
      <div className="d-flex align-items-center p-2 gap-3 flex-grow-1">
        {!canStart ? (
          // Wrap disabled button in span to enable tooltip
          <span title={buttonTitle}>
            <button
              className={clsx(
                'btn timer-btn',
                'btn-secondary',
                'd-flex align-items-center gap-2'
              )}
              disabled
              style={{ pointerEvents: 'none' }}
            >
              <i className="fas fa-play"></i>
              Start
            </button>
          </span>
        ) : (
          <button
            className={clsx(
              'btn timer-btn',
              isRunning ? 'btn-danger' : 'btn-success',
              'd-flex align-items-center gap-2'
            )}
            onClick={toggleTimer}
            title={buttonTitle}
          >
            <i className={clsx('fas', isRunning ? 'fa-circle' : 'fa-play')}></i>
            {isRunning ? 'Pause' : 'Start'}
          </button>
        )}

        {isRunning && (
          <span className="fw-semibold text-nowrap" title={fullTime}>
            {displayTime}
          </span>
        )}
      </div>

      <div className="tab-container">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'tab-item',
              current === t.id && 'tab-active'
            )}
            onClick={() => changeTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>
    </header>
  );
}
