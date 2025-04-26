import React from 'react';
import { clsx } from 'clsx';
import { Project } from '../types';

interface Props {
  tabs: { id: string; label: string }[];
  current: string;
  changeTab: (id: string) => void;
  activeProject: Project | null;
  isRunning: boolean;
  toggleTimer: () => void;
  elapsedMs: number;
}

export default function TopBar({ tabs, current, changeTab, activeProject, isRunning, toggleTimer, elapsedMs }: Props) {
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
    <header>
      <button onClick={toggleTimer}>{isRunning ? '⏸' : '▶︎'}</button>
      {activeProject ? (
        <span>
          {activeProject.name} · {hrs}:{mins}:{secs}
        </span>
      ) : (
        <span>No project</span>
      )}
      <nav style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
        {tabs.map((t) => (
          <a
            key={t.id}
            onClick={() => changeTab(t.id)}
            className={clsx({ active: current === t.id })}
            style={{ cursor: 'pointer' }}
          >
            {t.label}
          </a>
        ))}
      </nav>
    </header>
  );
}