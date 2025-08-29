import React, { createContext, useContext, ReactNode } from 'react';
import { Project } from '../types';

interface TimerContextValue {
  isRunning: boolean;
  projects: Project[];
  elapsedMs: number;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function TimerProvider({
  children,
  isRunning,
  projects,
  elapsedMs,
}: {
  children: ReactNode;
  isRunning: boolean;
  projects: Project[];
  elapsedMs: number;
}) {
  return (
    <TimerContext.Provider value={{ isRunning, projects, elapsedMs }}>
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
