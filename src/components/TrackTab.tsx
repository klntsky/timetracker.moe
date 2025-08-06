import React from 'react';
import { TimeEntry, Settings } from '../types';

import './TrackTab.css';
import { getWeekDays } from '../utils/timeUtils';
import EntryGrid from './EntryGrid';
import { usePersistedState } from '../hooks/usePersistedState';
import { useEntryContext } from '../contexts/EntryContext';
import { useProjectContext } from '../contexts/ProjectContext';

interface Props {
  settings: Settings;
  resumeEntry: (entry: TimeEntry) => void;
  toggleTimer: () => void;
}

function TrackTabComponent({ settings, resumeEntry, toggleTimer }: Props) {
  const [weekOffset, setWeekOffset] = usePersistedState('timetracker.moe.weekOffset', 0); // 0 = current week, -1 = last week, 1 = next week

  const { entries, addEntry } = useEntryContext();

  const { addProject } = useProjectContext();

  const weekStartsOn = settings.weekEndsOn === 'sunday' ? 'sunday' : 'saturday';

  // Use the new utility function to get the days of the week
  const days = getWeekDays(weekOffset, weekStartsOn);

  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToCurrentWeek = () => setWeekOffset(0);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);

  return (
    <>
      <div className="week-grid">
        <EntryGrid
          days={days}
          entries={entries}
          resumeEntry={resumeEntry}
          toggleTimer={toggleTimer}
          addEntry={addEntry}
          weekOffset={weekOffset}
          goToPreviousWeek={goToPreviousWeek}
          goToCurrentWeek={goToCurrentWeek}
          goToNextWeek={goToNextWeek}
        />
      </div>
      <button className="btn btn-outline-primary mt-3" onClick={addProject}>
        + Add project
      </button>
    </>
  );
}

export default React.memo(TrackTabComponent);
