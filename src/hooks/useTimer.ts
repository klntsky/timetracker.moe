import { useEffect, useState } from 'react';

export function useTimer(initialRunning: boolean, initialStart: string | null) {
  const [running, setRunning] = useState(initialRunning);
  const [startIso, setStartIso] = useState<string | null>(initialStart);
  const [, force] = useState(0);

  useEffect(() => {
    if (!running) return;
    const int = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(int);
  }, [running]);

  const start = () => {
    setRunning(true);
    setStartIso(new Date().toISOString());
  };
  const stop = () => setRunning(false);

  const elapsedMs = running && startIso ? Date.now() - new Date(startIso).getTime() : 0;
  return { running, startIso, start, stop, elapsedMs } as const;
}
