import React, { useState, useRef, ReactNode, useCallback } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  position?: 'left' | 'right';
  className?: string;
}

/**
 * Reusable dropdown component with click-outside detection
 */
const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  isOpen: controlledIsOpen,
  onOpenChange,
  position = 'right',
  className = '',
}) => {
  // Component can be either controlled or uncontrolled
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  
  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle opening and closing
  const handleOpenChange = useCallback((open: boolean) => {
    if (!isControlled) {
      setUncontrolledIsOpen(open);
    }
    onOpenChange?.(open);
  }, [isControlled, onOpenChange]);
  
  // Toggle open state
  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    handleOpenChange(!isOpen);
  }, [isOpen, handleOpenChange]);
  
  // Handle click outside
  useClickOutside(dropdownRef, () => handleOpenChange(false), isOpen);
  
  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <div onClick={toggle} className="dropdown-trigger">
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className="dropdown-menu show" 
          style={{ left: position === 'left' ? 0 : 'auto', right: position === 'right' ? 0 : 'auto' }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown; 