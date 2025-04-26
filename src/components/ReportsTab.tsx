import React, { useMemo, useState } from 'react';
import { Project, Settings, TimeEntry } from '../types';
import { PresetRange, getRange } from '../utils/dateRanges';

interface ReportsTabProps {
  projects: Project[];
  entries: TimeEntry[];
  settings: Settings;
  timerElapsedMs: number;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ projects, entries, settings, timerElapsedMs }) => {
  const [preset, setPreset] = useState<PresetRange>('CUSTOM');
  const defaultFrom = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().substring(0, 10);
  const defaultTo = new Date().toISOString().substring(0, 10);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [startDate, endDate] = getRange(preset, settings, { from, to });

  const filtered = entries.filter((e) => {
    const entryDate = new Date(e.start);
    return entryDate >= startDate && entryDate <= endDate;
  });

  const totals = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((e) => {
      // For active entries, add current elapsed time
      const entryDuration = e.active 
        ? (e.duration || 0) + timerElapsedMs
        : e.duration || 0;
      
      const hours = entryDuration / 3600000; // Convert ms to hours
      m.set(e.projectId, (m.get(e.projectId) || 0) + hours);
    });
    return Array.from(m.entries());
  }, [filtered, timerElapsedMs]);

  const pidToName = (pid: string) => projects.find((p) => p.id === pid)?.name || '???';

  return (
    <div className="card p-3 mt-3">
      <h3>Reports</h3>
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <select className="form-select w-auto" value={preset} onChange={(e) => setPreset(e.target.value as PresetRange)}>
          <option value="THIS_WEEK">This week</option>
          <option value="LAST_WEEK">Last week</option>
          <option value="TWO_WEEKS">Two weeks</option>
          <option value="LAST_TWO_WEEKS">Last two weeks</option>
          <option value="THIS_MONTH">This month</option>
          <option value="LAST_MONTH">Last month</option>
          <option value="CUSTOM">Custom</option>
        </select>
        {preset === 'CUSTOM' && (
          <>
            <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
      </div>
      <table className="table table-sm mt-3">
        <thead>
          <tr><th>Project</th><th className="text-end">Hours</th></tr>
        </thead>
        <tbody>
          {totals.map(([pid, h]) => (
            <tr key={pid}><td>{pidToName(pid)}</td><td className="text-end">{h.toFixed(2)}</td></tr>
          ))}
        </tbody>
      </table>
      <small>
        Period: {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()} ({filtered.length} entries)
      </small>
    </div>
  );
};

export default ReportsTab; 