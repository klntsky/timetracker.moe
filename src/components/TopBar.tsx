// src/components/TopBar.tsx
import React from 'react';
import { TimeEntry } from '../types';
import clsx from 'clsx';
import { formatTimeHHMM, formatTimeHHMMSS } from '../utils/timeFormatters';

interface Props {
  tabs: { id: string; label: string }[];
  current: string;
  changeTab: (id: string) => void;
  activeEntry: TimeEntry | null;
  isRunning: boolean;
  toggleTimer: () => void;
  elapsedMs: number;
}

export default function TopBar({
  tabs,
  current,
  changeTab,
  activeEntry,
  isRunning,
  toggleTimer,
  elapsedMs,
}: Props) {
  // Format time using our utility functions
  const displayTime = formatTimeHHMM(elapsedMs);
  const fullTime = formatTimeHHMMSS(elapsedMs);

  return (
    <header className="d-flex align-items-center border-bottom p-2 bg-white gap-3">
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

      {activeEntry ? (
        <span className="fw-semibold text-nowrap" title={fullTime}>
          {displayTime}
        </span>
      ) : (
        <span>No active entry</span>
      )}

      <nav className="ms-auto d-flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={clsx(
              'btn btn-link text-decoration-none',
              current === t.id && 'fw-bold'
            )}
            onClick={() => changeTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
