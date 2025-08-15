import { useState, useRef, useCallback, useEffect } from 'react';

interface UseDraggableOptions {
  initialPosition?: { x: number; y: number };
  constrainToViewport?: boolean;
  disabled?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

interface UseDraggableReturn {
  position: { x: number; y: number };
  isDragging: boolean;
  dragRef: React.RefObject<HTMLElement>;
  handleRef: React.RefObject<HTMLElement>;
  style: React.CSSProperties;
  resetPosition: () => void;
  setPosition: (position: { x: number; y: number }) => void;
}

export const useDraggable = ({
  initialPosition = { x: 50, y: 50 },
  constrainToViewport = true,
  disabled = false,
  onPositionChange,
}: UseDraggableOptions = {}): UseDraggableReturn => {
  const [position, setPositionState] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const dragRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLElement>(null);

  const setPosition = useCallback((newPosition: { x: number; y: number }) => {
    setPositionState(newPosition);
    onPositionChange?.(newPosition);
  }, [onPositionChange]);

  const resetPosition = useCallback(() => {
    setPosition(initialPosition);
  }, [initialPosition, setPosition]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const offset = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    setDragOffset(offset);
  }, [position, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || disabled) return;

    let newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    };

    // Constrain to viewport if enabled
    if (constrainToViewport && dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
      newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
    }

    setPosition(newPosition);
  }, [isDragging, dragOffset, constrainToViewport, disabled, setPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events for mobile support
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    
    const offset = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
    setDragOffset(offset);
  }, [position, disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const touch = e.touches[0];
    let newPosition = {
      x: touch.clientX - dragOffset.x,
      y: touch.clientY - dragOffset.y,
    };

    // Constrain to viewport if enabled
    if (constrainToViewport && dragRef.current) {
      const rect = dragRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
      newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
    }

    setPosition(newPosition);
  }, [isDragging, dragOffset, constrainToViewport, disabled, setPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach event listeners to the drag handle
  useEffect(() => {
    const handleElement = handleRef.current;
    if (!handleElement) return;

    handleElement.addEventListener('mousedown', handleMouseDown);
    handleElement.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      handleElement.removeEventListener('mousedown', handleMouseDown);
      handleElement.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleMouseDown, handleTouchStart]);

  // Attach global move and end events
  useEffect(() => {
    if (!isDragging) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Prevent text selection and set cursor
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: isDragging ? 9999 : 50,
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    transition: isDragging ? 'none' : 'transform 0.2s ease',
    cursor: isDragging ? 'move' : 'default',
  };

  return {
    position,
    isDragging,
    dragRef,
    handleRef,
    style,
    resetPosition,
    setPosition,
  };
};

export default useDraggable;
