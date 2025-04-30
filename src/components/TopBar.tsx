// src/components/TopBar.tsx
import React from 'react';
import { TimeEntry } from '../types';
import clsx from 'clsx';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';
import './TopBar.css'; // We'll create this file next

interface Props {
  tabs: { id: string; label: string }[];
  current: string;
  changeTab: (id: string) => void;
  lastUsedEntry: TimeEntry | null;
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

  // Only show the timer button if it's running or if we can resume
  const shouldShowTimerButton = isRunning || showResumeButton;

  return (
    <header className="d-flex align-items-center border-bottom p-2 bg-white gap-3">
      {shouldShowTimerButton && (
      <button
        className={clsx(
          'btn',
          isRunning ? 'btn-danger' : 'btn-success',
          'd-flex align-items-center gap-2'
        )}
        onClick={toggleTimer}
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

      <div className="ms-auto tab-container">
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
