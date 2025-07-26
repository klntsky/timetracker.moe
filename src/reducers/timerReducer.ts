import { match } from 'ts-pattern';

// Define timer state
export interface TimerState {
  running: boolean;
  start: string | null;
  lastEntryId: number | null;
  lastProjectId: number | null;
}

// Define possible actions for the timer reducer
export type TimerAction =
  | { type: 'START_TIMER'; entryId: number; projectId: number; startTime: string }
  | { type: 'STOP_TIMER' }
  | { type: 'UPDATE_TIMER_STATE'; running: boolean; start: string | null }
  | { type: 'UPDATE_PROJECT_ID'; projectId: number };

// Timer action creator functions
export const timerActions = {
  startTimer: (entryId: number, projectId: number, startTime: string): TimerAction => ({
    type: 'START_TIMER',
    entryId,
    projectId,
    startTime
  }),
  
  stopTimer: (): TimerAction => ({
    type: 'STOP_TIMER'
  }),
  
  updateTimerState: (running: boolean, start: string | null): TimerAction => ({
    type: 'UPDATE_TIMER_STATE',
    running,
    start
  }),
  
  updateProjectId: (projectId: number): TimerAction => ({
    type: 'UPDATE_PROJECT_ID',
    projectId
  })
};

// Timer reducer function with ts-pattern
export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  return match(action)
    .with({ type: 'START_TIMER' }, ({ entryId, projectId, startTime }: { entryId: number; projectId: number; startTime: string }) => ({
      ...state,
      running: true,
      start: startTime,
      lastEntryId: entryId,
      lastProjectId: projectId
    }))
    .with({ type: 'STOP_TIMER' }, () => ({
      ...state,
      running: false,
      start: null
    }))
    .with({ type: 'UPDATE_TIMER_STATE' }, ({ running, start }: { running: boolean; start: string | null }) => ({
      ...state,
      running,
      start
    }))
    .with({ type: 'UPDATE_PROJECT_ID' }, ({ projectId }: { projectId: number }) => ({
      ...state,
      lastProjectId: projectId
    }))
    .exhaustive();
} 