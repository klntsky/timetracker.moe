import React from 'react';
import WeekNavigation from './WeekNavigation';

interface TimeGridHeaderProps {
  days: Date[];
  weekOffset: number;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;
  goToNextWeek: () => void;
}

const TimeGridHeader: React.FC<TimeGridHeaderProps> = ({ 
  days, 
  weekOffset,
  goToPreviousWeek,
  goToCurrentWeek,
  goToNextWeek
}) => {
  return (
    <>
      {/* Empty cell in the top-left corner */}
      <div className="header corner-header">
        <WeekNavigation 
          weekOffset={weekOffset}
          goToPreviousWeek={goToPreviousWeek}
          goToCurrentWeek={goToCurrentWeek}
          goToNextWeek={goToNextWeek}
        />
      </div>
      
      {/* Day headers */}
      {days.map((d) => (
        <div key={d.toDateString()} className="header">
          {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
        </div>
      ))}
    </>
  );
};

export default TimeGridHeader; 