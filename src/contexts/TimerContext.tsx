import React, { createContext, useContext, ReactNode } from 'react';
import { Project } from '../types';

interface TimerContextValue {
  isRunning: boolean;
  projects: Project[];
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

export function TimerProvider({
  children,
  isRunning,
  projects,
}: {
  children: ReactNode;
  isRunning: boolean;
  projects: Project[];
}) {
  return <TimerContext.Provider value={{ isRunning, projects }}>{children}</TimerContext.Provider>;
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  return context;
}
