import React from 'react';

interface WeekNavigationProps {
  weekOffset: number;
  goToPreviousWeek: () => void;
  goToCurrentWeek: () => void;
  goToNextWeek: () => void;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  weekOffset,
  goToPreviousWeek,
  goToCurrentWeek,
  goToNextWeek,
}) => {
  // Check if we're on the current week
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="week-nav-controls">
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={goToPreviousWeek}
        title="Previous Week"
      >
        <i className="fas fa-chevron-left"></i>
      </button>

      <button
        className="btn btn-sm btn-outline-secondary mx-2"
        onClick={goToNextWeek}
        title="Next Week"
      >
        <i className="fas fa-chevron-right"></i>
      </button>

      {!isCurrentWeek && (
        <button
          className="btn btn-sm btn-outline-primary ml-auto"
          onClick={goToCurrentWeek}
          title="Go to today's date"
        >
          <i className="fas fa-home"></i>
        </button>
      )}
    </div>
  );
};

export default WeekNavigation;
