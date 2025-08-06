import React, { useMemo, useState } from 'react';
import { Project, Settings, TimeEntry } from '../types';
import { PresetRange, getRange } from '../utils/dateRanges';
import { formatDecimalHours } from '../utils/timeFormatters';
import { usePersistedState } from '../hooks/usePersistedState';
import { useEntryContext } from '../contexts/EntryContext';

interface ReportsTabProps {
  projects: Project[];
  settings: Settings;
  timerElapsedMs: number;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ projects, settings, timerElapsedMs }) => {
  const [preset, setPreset] = usePersistedState<PresetRange>('timetracker.moe.reportPreset', 'THIS_WEEK');
  const defaultFrom = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().substring(0, 10);
  const defaultTo = new Date().toISOString().substring(0, 10);
  const [from, setFrom] = usePersistedState('timetracker.moe.reportFromDate', defaultFrom);
  const [to, setTo] = usePersistedState('timetracker.moe.reportToDate', defaultTo);
  
  // Get entries from context instead of props
  const { entries } = useEntryContext();

  // Get date range based on preset
  const [startDate, endDate] = getRange(preset, settings, { from, to });

  const filtered = entries.filter((e) => {
    const entryDate = new Date(e.start);
    
    // Make start date the beginning of the day (00:00:00)
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);
    
    // Make end date the end of the day (23:59:59.999)
    const endDay = new Date(endDate);
    endDay.setHours(23, 59, 59, 999);
    
    // Compare entry timestamp with the day boundaries
    return entryDate >= startDay && entryDate <= endDay;
  });

  const totals = useMemo(() => {
    const m = new Map<number, number>();
    filtered.forEach((e) => {
      // For active entries, add current elapsed time
      const entryDuration = e.active 
        ? (e.duration || 0) + timerElapsedMs
        : e.duration || 0;
      
      // Store the raw milliseconds - we'll format when displaying
      m.set(e.projectId, (m.get(e.projectId) || 0) + entryDuration);
    });
    return Array.from(m.entries());
  }, [filtered, timerElapsedMs]);

  const pidToName = (pid: number) => projects.find((p) => p.id === pid)?.name || '???';
  
  const getBillableAmount = (pid: number, totalMs: number) => {
    const project = projects.find(p => p.id === pid);
    if (!project || !project.billableRate) return null;
    
    const hours = totalMs / 3600000; // Convert ms to hours
    return {
      amount: hours * project.billableRate.amount,
      currency: project.billableRate.currency
    };
  };
  
  const formatBillableAmount = (billable: { amount: number, currency: string } | null) => {
    if (!billable) return '-';
    return `${billable.currency} ${billable.amount.toFixed(2)}`;
  };

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
          <tr>
            <th>Project</th>
            <th className="text-end">Hours</th>
            <th className="text-end">Billable Amount</th>
          </tr>
        </thead>
        <tbody>
          {totals.map(([pid, ms]) => (
            <tr key={pid}>
              <td>{pidToName(pid)}</td>
              <td className="text-end">{formatDecimalHours(ms)}</td>
              <td className="text-end">{formatBillableAmount(getBillableAmount(pid, ms))}</td>
            </tr>
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