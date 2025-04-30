import { useCallback, useReducer, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useTimer } from './useTimer';
import { timerReducer, TimerState, timerActions } from '../reducers/timerReducer';

/**
 * Core hook for managing timer state
 * This is a lower-level hook that handles only timer state management
 */
export function useTimerStore() {
  // Get initial timer state from localStorage
  const [storedTimer, setStoredTimer] = useLocalStorage<TimerState>(
    'harnesstime.timer', 
    { running: false, start: null, lastEntryId: null, lastProjectId: null }
  );
  
  // Set up reducer with initial state from localStorage
  const [timerState, dispatchTimer] = useReducer(timerReducer, storedTimer);
  
  // Set up timer instance
  const timerInstance = useTimer(timerState.running, timerState.start);

  // Sync reducer state back to localStorage whenever it changes
  useEffect(() => {
    setStoredTimer(timerState);
  }, [timerState, setStoredTimer]);
  
  // Sync timer instance state with reducer state
  useEffect(() => {
    if (timerInstance.running !== timerState.running || timerInstance.startIso !== timerState.start) {
      dispatchTimer(timerActions.updateTimerState(timerInstance.running, timerInstance.startIso));
    }
  }, [timerInstance.running, timerInstance.startIso, timerState.running, timerState.start]);

  // Start the timer
  const startTimer = useCallback(
    (entryId: string, projectId: string, startTime: string = new Date().toISOString()) => {
      timerInstance.start();
      dispatchTimer(timerActions.startTimer(entryId, projectId, startTime));
    },
    [timerInstance],
  );

  // Stop the timer
  const stopTimer = useCallback(() => {
    timerInstance.stop();
    dispatchTimer(timerActions.stopTimer());
  }, [timerInstance]);

  // Update the project ID in timer state
  const updateProjectId = useCallback(
    (projectId: string) => {
      dispatchTimer(timerActions.updateProjectId(projectId));
    },
    [],
  );

  // Calculate elapsed milliseconds if timer is running
  const getElapsedMs = useCallback(() => {
    if (timerState.running && timerState.start) {
      const now = new Date();
      const startTime = new Date(timerState.start);
      return now.getTime() - startTime.getTime();
    }
    return 0;
  }, [timerState.running, timerState.start]);

  return {
    timer: timerState,
    isRunning: timerState.running,
    startTimer,
    stopTimer,
    updateProjectId,
    elapsedMs: getElapsedMs()
  };
} 