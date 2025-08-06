import React, { useState, useRef, useEffect } from 'react';

interface EditableProjectNameProps {
  name: string;
  onRename: (newName: string) => void;
}

const EditableProjectName: React.FC<EditableProjectNameProps> = ({ name, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  // When entering edit mode, focus the input and select all text
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    setEditedName(name);
    setIsEditing(true);
  };

  const handleSave = () => {
    // Don't save empty names
    if (editedName.trim() === '') {
      setEditedName(name);
    } else if (editedName !== name) {
      onRename(editedName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedName(name);
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent other click handlers from firing
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="form-control form-control-sm"
        value={editedName}
        onChange={(e) => setEditedName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={handleClick}
        style={{ minWidth: '120px' }}
      />
    );
  }

  return (
    <span
      className="project-name"
      onClick={handleStartEditing}
      style={{ cursor: 'pointer' }}
      title="Click to edit"
    >
      {name}
    </span>
  );
};

export default EditableProjectName;
