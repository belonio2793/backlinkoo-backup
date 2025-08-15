import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Move, Minimize2, Maximize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  initialPosition?: { x: number; y: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  defaultSize?: { width: number; height: number };
  enableResize?: boolean;
  enableMinimize?: boolean;
  className?: string;
}

export const DraggableDialog: React.FC<DraggableDialogProps> = ({
  open,
  onOpenChange,
  children,
  title = "Draggable Window",
  initialPosition = { x: 100, y: 100 },
  minSize = { width: 300, height: 200 },
  maxSize = { width: 1200, height: 800 },
  defaultSize = { width: 600, height: 400 },
  enableResize = true,
  enableMinimize = true,
  className = '',
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setPosition(initialPosition);
      setSize(defaultSize);
      setIsMinimized(false);
    }
  }, [open, initialPosition, defaultSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };

      // Constrain to viewport bounds
      const windowElement = windowRef.current;
      if (windowElement) {
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
        newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
      }

      setPosition(newPosition);
    }

    if (isResizing) {
      const newWidth = Math.max(
        minSize.width,
        Math.min(maxSize.width, resizeStart.width + (e.clientX - resizeStart.x))
      );
      const newHeight = Math.max(
        minSize.height,
        Math.min(maxSize.height, resizeStart.height + (e.clientY - resizeStart.y))
      );

      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, size, minSize, maxSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
  }, [size]);

  // Attach global event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection while dragging/resizing
      document.body.style.userSelect = 'none';
      if (isDragging) {
        document.body.style.cursor = 'move';
      } else if (isResizing) {
        document.body.style.cursor = 'nw-resize';
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (isDragging || isResizing) {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (!open) return null;

  return (
    <>
      {/* Custom overlay */}
      <div className="fixed inset-0 z-50 bg-black/20" onClick={() => onOpenChange(false)} />
      
      {/* Draggable window */}
      <div
        ref={windowRef}
        className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden ${className}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: isMinimized ? 'auto' : `${size.height}px`,
          transform: isDragging || isResizing ? 'scale(1.01)' : 'scale(1)',
          transition: isDragging || isResizing ? 'none' : 'transform 0.2s ease',
        }}
      >
        {/* Title Bar */}
        <div
          className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">{title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Window controls */}
            {enableMinimize && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-yellow-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-green-100"
              onClick={(e) => {
                e.stopPropagation();
                setSize(size.width === maxSize.width ? defaultSize : maxSize);
              }}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChange(false);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 overflow-auto" style={{ height: size.height - 60 }}>
            <div className="p-4">
              {children}
            </div>
          </div>
        )}

        {/* Resize handle */}
        {enableResize && !isMinimized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-gray-300 cursor-nw-resize opacity-50 hover:opacity-100"
            onMouseDown={handleResizeStart}
            style={{
              clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)'
            }}
          />
        )}
      </div>
    </>
  );
};

export default DraggableDialog;
