import { useState, useCallback, useRef, useEffect } from 'react';
import { Project } from '../types';

interface DragState {
  isDragging: boolean;
  draggedProjectId: number | null;
  draggedElement: HTMLElement | null;
  preview: HTMLElement | null;
  initialMousePos: { x: number; y: number };
  offset: { x: number; y: number };
}

interface DropZone {
  projectId: number;
  insertPosition: 'before' | 'after';
}

interface DragReorderHook {
  dragState: DragState;
  handleDragStart: (projectId: number) => (e: React.MouseEvent | React.TouchEvent) => void;
  getDropZoneState: (projectId: number) => {
    isDropTarget: boolean;
    insertPosition?: 'before' | 'after';
  };
}

export function useDragReorder(
  projects: Project[],
  onReorder: (draggedId: number, targetId: number, insertAfter?: boolean) => void
): DragReorderHook {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedProjectId: null,
    draggedElement: null,
    preview: null,
    initialMousePos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  });

  const [currentDropZone, setCurrentDropZone] = useState<DropZone | null>(null);
  const currentDropZoneRef = useRef<DropZone | null>(null);

  // Get coordinates from mouse or touch event
  const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  // Create semi-transparent preview element
  const createPreview = (originalElement: HTMLElement) => {
    const preview = originalElement.cloneNode(true) as HTMLElement;
    preview.style.position = 'fixed';
    preview.style.pointerEvents = 'none';
    preview.style.zIndex = '1000';
    preview.style.opacity = '0.7';
    preview.style.transform = 'rotate(3deg)';
    preview.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
    preview.style.borderRadius = '8px';
    preview.style.backgroundColor = '#fff';
    preview.style.width = originalElement.offsetWidth + 'px';
    document.body.appendChild(preview);
    return preview;
  };

  // Update preview position
  const updatePreviewPosition = useCallback((x: number, y: number, offset: { x: number; y: number }) => {
    if (dragState.preview) {
      dragState.preview.style.left = (x - offset.x) + 'px';
      dragState.preview.style.top = (y - offset.y) + 'px';
    }
  }, [dragState.preview]);

  // Handle mouse/touch move
  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.preview) return;

    const { x, y } = getEventCoordinates(e);
    updatePreviewPosition(x, y, dragState.offset);

    // Find element under cursor/touch and determine precise drop zone
    const elementBelow = document.elementFromPoint(x, y);
    const projectHeader = elementBelow?.closest('.project-header');
    
    if (projectHeader) {
      const projectIdAttr = projectHeader.getAttribute('data-project-id');
      if (projectIdAttr) {
        const projectId = parseInt(projectIdAttr);
        
        // Skip if it's the dragged project itself
        if (projectId === dragState.draggedProjectId) {
          setCurrentDropZone(null);
          currentDropZoneRef.current = null;
          return;
        }
        
        // Determine if cursor is in top half or bottom half
        const rect = projectHeader.getBoundingClientRect();
        const midPoint = rect.top + rect.height / 2;
        const insertPosition: 'before' | 'after' = y < midPoint ? 'before' : 'after';
        
        const dropZone = { projectId, insertPosition };
        setCurrentDropZone(dropZone);
        currentDropZoneRef.current = dropZone;
      }
    } else {
      setCurrentDropZone(null);
      currentDropZoneRef.current = null;
    }
  }, [dragState.isDragging, dragState.preview, dragState.offset, dragState.draggedProjectId, updatePreviewPosition]);

  // Handle mouse/touch end
  const handleEnd = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !dragState.draggedProjectId) return;

    // Clean up
    if (dragState.preview) {
      document.body.removeChild(dragState.preview);
    }

    if (dragState.draggedElement) {
      dragState.draggedElement.style.opacity = '1';
    }

    // Perform reorder if dropped on a valid target
    if (currentDropZoneRef.current && dragState.draggedProjectId) {
      const { projectId, insertPosition } = currentDropZoneRef.current;
      
      if (insertPosition === 'before') {
        onReorder(dragState.draggedProjectId, projectId, false);
      } else {
        // For 'after' insertion
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex === projects.length - 1) {
          // Insert at the end
          onReorder(dragState.draggedProjectId, -1, false);
        } else {
          onReorder(dragState.draggedProjectId, projectId, true);
        }
      }
    }

    // Reset state
    setDragState({
      isDragging: false,
      draggedProjectId: null,
      draggedElement: null,
      preview: null,
      initialMousePos: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
    });

    setCurrentDropZone(null);
    currentDropZoneRef.current = null;
  }, [dragState, onReorder]);

  // Attach global event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [dragState.isDragging, handleMove, handleEnd]);

  // Handle drag start
  const handleDragStart = useCallback((projectId: number) => 
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();

      const target = e.currentTarget as HTMLElement;
      const projectHeader = target.closest('.project-header') as HTMLElement;
      
      if (!projectHeader) return;

      const { x, y } = getEventCoordinates(e.nativeEvent);
      const rect = projectHeader.getBoundingClientRect();
      const offset = {
        x: x - rect.left,
        y: y - rect.top,
      };

      // Create preview
      const preview = createPreview(projectHeader);
      updatePreviewPosition(x, y, offset);

      // Make original element semi-transparent
      projectHeader.style.opacity = '0.4';

      setDragState({
        isDragging: true,
        draggedProjectId: projectId,
        draggedElement: projectHeader,
        preview,
        initialMousePos: { x, y },
        offset,
      });
    }, [updatePreviewPosition]);

  const getDropZoneState = useCallback((projectId: number) => {
    if (!dragState.isDragging || 
        dragState.draggedProjectId === projectId || 
        !currentDropZone ||
        currentDropZone.projectId !== projectId) {
      return { isDropTarget: false };
    }
    
    return {
      isDropTarget: true,
      insertPosition: currentDropZone.insertPosition
    };
  }, [dragState.isDragging, dragState.draggedProjectId, currentDropZone]);

  return {
    dragState,
    handleDragStart,
    getDropZoneState,
  };
} 