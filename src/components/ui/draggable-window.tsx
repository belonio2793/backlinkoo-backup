import React, { useState, useRef, useCallback } from 'react';
import { Move } from 'lucide-react';

interface DraggableWindowProps {
  children: React.ReactNode;
  title?: string;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  className?: string;
  dragHandleClassName?: string;
  enableDrag?: boolean;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
  children,
  title,
  initialPosition = { x: 50, y: 50 },
  onPositionChange,
  className = '',
  dragHandleClassName = '',
  enableDrag = true,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableDrag) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position, enableDrag]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !enableDrag) return;

    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };

    // Constrain to viewport bounds
    const windowElement = windowRef.current;
    if (windowElement) {
      const rect = windowElement.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
      newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
    }

    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [isDragging, dragStart, onPositionChange, enableDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle touch events for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableDrag) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  }, [position, enableDrag]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !enableDrag) return;
    
    const touch = e.touches[0];
    const newPosition = {
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    };

    // Constrain to viewport bounds
    const windowElement = windowRef.current;
    if (windowElement) {
      const rect = windowElement.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
      newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
    }

    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [isDragging, dragStart, onPositionChange, enableDrag]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'move';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      if (isDragging) {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={windowRef}
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
      }}
    >
      {/* Drag Handle */}
      {enableDrag && (
        <div
          className={`flex items-center justify-between p-3 bg-gray-50 border-b cursor-move select-none ${dragHandleClassName}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-gray-500" />
            {title && <span className="font-medium text-gray-700">{title}</span>}
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default DraggableWindow;
