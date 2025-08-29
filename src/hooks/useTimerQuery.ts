import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTimer, setTimer } from '../lib/timer.api';
import { TimerState } from '../reducers/timerReducer';

export function useTimerQuery() {
  const qc = useQueryClient();
  const timerQuery = useQuery({ queryKey: ['timer'], queryFn: getTimer, staleTime: Infinity });

  const mutateTimer = useMutation({
    mutationFn: async (updater: (prev: TimerState) => TimerState) => {
      const prev = await getTimer();
      const next = updater(prev);
      await setTimer(next);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timer'] }),
  });

  const startTimer = (entryId: number, projectId: number, startTime?: string) =>
    mutateTimer.mutate(() => ({
      running: true,
      start: startTime || new Date().toISOString(),
      lastEntryId: entryId,
      lastProjectId: projectId,
    }));

  const stopTimer = () =>
    mutateTimer.mutate((prev) => ({
      running: false,
      start: null,
      lastEntryId: prev.lastEntryId,
      lastProjectId: prev.lastProjectId,
    }));

  const updateProjectId = (projectId: number) =>
    mutateTimer.mutate((prev) => ({ ...prev, lastProjectId: projectId }));

  const resetTimer = () =>
    mutateTimer.mutate(() => ({
      running: false,
      start: null,
      lastEntryId: null,
      lastProjectId: null,
    }));

  const running = timerQuery.data?.running ?? false;
  const startIso = timerQuery.data?.start ?? null;

  const elapsedMs = useMemo(() => {
    if (!running || !startIso) return 0;
    const now = Date.now();
    const start = new Date(startIso).getTime();
    return Math.max(0, now - start);
  }, [running, startIso]);

  return {
    timer: timerQuery.data ?? {
      running: false,
      start: null,
      lastEntryId: null,
      lastProjectId: null,
    },
    isLoading: timerQuery.isLoading,
    startTimer,
    stopTimer,
    updateProjectId,
    resetTimer,
    getElapsedMs: () => elapsedMs,
  } as const;
}
