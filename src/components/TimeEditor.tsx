import React, { useState, useRef, useEffect } from 'react';
import { formatTimeHHMM } from '../utils/timeFormatters';
import '../styles/EntryGrid.css';

interface TimeEditorProps {
  duration: number;
  onSave: (newDuration: number) => void;
  onCancel: () => void;
}

const TimeEditor = ({ duration, onSave, onCancel }: TimeEditorProps) => {
  const [value, setValue] = useState(formatTimeHHMM(duration));
  const [isValid, setIsValid] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const validateTime = (timeString: string): boolean => {
    const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  };

  const saveTime = () => {
    if (validateTime(value)) {
      const [hours, minutes] = value.split(':').map(Number);
      // Convert hours and minutes to milliseconds as expected by the application
      const newDuration = hours * 3600000 + minutes * 60000;
      setIsFadingOut(true);

      // Delay the save slightly to allow the animation to be seen
      setTimeout(() => {
        onSave(newDuration);
      }, 300);
      return true;
    }
    return false;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsValid(validateTime(newValue) || newValue.length < 5);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const saved = saveTime();
      if (!saved) {
        setIsValid(false);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleBlur = () => {
    // Try to save on blur, otherwise cancel
    if (!saveTime()) {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      className={`time-editor ${!isValid ? 'invalid' : ''} ${isFadingOut ? 'time-editor-fade-out' : ''}`}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="HH:MM"
    />
  );
};

export default TimeEditor;
