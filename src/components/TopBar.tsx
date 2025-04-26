import React from 'react';
import { TimeEntry } from '../types';
import clsx from 'clsx';

interface Props {
  tabs: { id: string; label: string }[];
  current: string;
  changeTab: (id: string) => void;
  activeEntry: TimeEntry | null;
  isRunning: boolean;
  toggleTimer: () => void;
  elapsedMs: number;
}

export default function TopBar({ tabs, current, changeTab, activeEntry, isRunning, toggleTimer, elapsedMs }: Props) {
  const hrs = Math.floor(elapsedMs / 3600000)
    .toString()
    .padStart(2, '0');
  const mins = Math.floor((elapsedMs % 3600000) / 60000)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor((elapsedMs % 60000) / 1000)
    .toString()
    .padStart(2, '0');

  return (
    <header className="d-flex align-items-center border-bottom p-2 bg-white gap-3">
      <button
        className={clsx('btn', isRunning ? 'btn-danger' : 'btn-success', 'd-flex align-items-center gap-2')}
        onClick={toggleTimer}
      >
        <i className={clsx('fas', isRunning ? 'fa-circle' : 'fa-play')}></i>
        {isRunning ? 'Pause' : 'Start'}
      </button>
      {activeEntry && (
        <span className="fw-semibold text-nowrap">
          {hrs}:{mins}:{secs}
        </span>
      )}
      <nav className="ms-auto d-flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={clsx('btn btn-link text-decoration-none', current === t.id && 'fw-bold')}
            onClick={() => changeTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}