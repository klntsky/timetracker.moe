import React, { createContext, useContext, ReactNode } from 'react';
import { Project } from '../types';
import { useTimerQuery } from '../hooks/useTimerQuery';
import { useProjectContext } from './ProjectContext';

interface TimerContextValue {
  isRunning: boolean;
  projects: Project[];
  elapsedMs: number;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { timer, getElapsedMs } = useTimerQuery();
  const { projects } = useProjectContext();

  return (
    <TimerContext.Provider
      value={{ isRunning: timer.running, projects, elapsedMs: getElapsedMs() }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}
