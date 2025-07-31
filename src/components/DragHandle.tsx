import React from 'react';
import '../styles/dragAndDrop.css';

interface DragHandleProps {
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  className?: string;
}

const DragHandle: React.FC<DragHandleProps> = ({ onDragStart, className = '' }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onDragStart(e);
  };

  return (
    <button
      className={`drag-handle ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      aria-label="Drag to reorder project"
      type="button"
    >
      <i className="fas fa-grip-vertical"></i>
    </button>
  );
};

export default DragHandle; 