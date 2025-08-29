import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TimeEntry } from '../types';
import { getEntries, setEntries } from '../lib/entries.api';

export function useEntriesQuery() {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({
    queryKey: ['entries'],
    queryFn: getEntries,
    staleTime: Infinity,
  });

  const mutateEntries = useMutation({
    mutationFn: async (updater: (prev: TimeEntry[]) => TimeEntry[]) => {
      const prev = await getEntries();
      const next = updater(prev);
      await setEntries(next);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entries'] }),
  });

  const addEntry = (entry: TimeEntry) => mutateEntries.mutate((prev) => [...prev, entry]);
  const updateEntry = (id: number, updates: Partial<TimeEntry>) =>
    mutateEntries.mutate((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  const deleteEntry = (id: number) =>
    mutateEntries.mutate((prev) => prev.filter((e) => e.id !== id));
  const changeEntryProject = (id: number, projectId: number) =>
    mutateEntries.mutate((prev) => prev.map((e) => (e.id === id ? { ...e, projectId } : e)));
  const updateEntryDuration = (id: number, additionalMs: number) =>
    mutateEntries.mutate((prev) =>
      prev.map((e) => (e.id === id ? { ...e, duration: e.duration + additionalMs } : e))
    );
  const setAll = (entries: TimeEntry[]) => mutateEntries.mutate(() => entries);

  // Atomically finalize a stopped entry: add elapsed and mark inactive
  const finalizeStoppedEntry = (id: number, additionalMs: number) =>
    mutateEntries.mutate((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, duration: e.duration + additionalMs, active: false } : e
      )
    );

  return {
    entries: entriesQuery.data ?? [],
    isLoading: entriesQuery.isLoading,
    isMutating: mutateEntries.isPending,
    addEntry,
    updateEntry,
    deleteEntry,
    changeEntryProject,
    updateEntryDuration,
    finalizeStoppedEntry,
    setEntries: setAll,
  } as const;
}
