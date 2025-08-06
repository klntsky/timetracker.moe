import React, { useState, useRef, ReactNode, useCallback, useEffect } from 'react';
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle opening and closing
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setUncontrolledIsOpen(open);
      }
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange]
  );

  // Toggle open state
  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event bubbling
      handleOpenChange(!isOpen);
    },
    [isOpen, handleOpenChange]
  );

  // Handle click outside
  useClickOutside(dropdownRef, () => handleOpenChange(false), isOpen);

  // Position the dropdown menu relative to the trigger button
  useEffect(() => {
    if (isOpen && triggerRef.current && menuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      let top = triggerRect.bottom;
      let left = position === 'left' ? triggerRect.left : triggerRect.right - menuRect.width;

      // Ensure the menu stays within viewport
      if (top + menuRect.height > window.innerHeight) {
        top = triggerRect.top - menuRect.height;
      }

      if (left < 0) {
        left = 0;
      } else if (left + menuRect.width > window.innerWidth) {
        left = window.innerWidth - menuRect.width;
      }

      menuRef.current.style.top = `${top}px`;
      menuRef.current.style.left = `${left}px`;
    }
  }, [isOpen, position]);

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <div onClick={toggle} className="dropdown-trigger" ref={triggerRef}>
        {trigger}
      </div>

      {isOpen && (
        <div className="dropdown-menu show" ref={menuRef}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
