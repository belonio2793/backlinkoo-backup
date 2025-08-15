import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDraggable } from '@/hooks/useDraggable';
import { 
  Settings, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  TestTube,
  RefreshCw,
  Move,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface EnvironmentState {
  mockMode: boolean;
  testMode: boolean;
  environment: string;
  isDevelopment: boolean;
}

const DraggableEnvironmentSwitcher: React.FC = () => {
  const [state, setState] = useState<EnvironmentState>({
    mockMode: localStorage.getItem('automation-mock-mode') === 'true',
    testMode: import.meta.env.MODE === 'test',
    environment: import.meta.env.MODE || 'development',
    isDevelopment: import.meta.env.DEV || false
  });

  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Draggable functionality
  const {
    position,
    isDragging,
    dragRef,
    handleRef,
    style,
    resetPosition,
  } = useDraggable({
    initialPosition: { 
      x: window.innerWidth - 340, // Start from right side
      y: window.innerHeight - 600 // Start from bottom
    },
    constrainToViewport: true,
    disabled: !isVisible,
    onPositionChange: (newPosition) => {
      // Save position to localStorage
      localStorage.setItem('dev-tools-position', JSON.stringify(newPosition));
    }
  });

  // Only show in development
  useEffect(() => {
    setIsVisible(state.isDevelopment || state.environment === 'development');
    
    // Restore saved position
    const savedPosition = localStorage.getItem('dev-tools-position');
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        // Position will be restored by the hook on next render
      } catch (e) {
        console.log('Could not restore dev tools position');
      }
    }
  }, [state.isDevelopment, state.environment]);

  const toggleMockMode = () => {
    const newMockMode = !state.mockMode;
    localStorage.setItem('automation-mock-mode', newMockMode.toString());
    setState(prev => ({ ...prev, mockMode: newMockMode }));
    
    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const clearMockData = () => {
    localStorage.removeItem('automation-mock-mode');
    localStorage.removeItem('mock-campaign-data');
    localStorage.removeItem('mock-test-results');
    
    // Clear any other mock-related data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mock-') || key.startsWith('test-')) {
        localStorage.removeItem(key);
      }
    });

    setState(prev => ({ ...prev, mockMode: false }));
    window.location.reload();
  };

  const getEnvironmentColor = () => {
    switch (state.environment) {
      case 'development': return 'bg-blue-500';
      case 'testing': return 'bg-yellow-500';
      case 'staging': return 'bg-orange-500';
      case 'production': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEnvironmentIcon = () => {
    if (state.mockMode) return <TestTube className="h-4 w-4" />;
    if (state.testMode) return <Zap className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('dev-tools-hidden', 'true');
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isVisible) {
    return (
      <Button
        className="fixed bottom-4 right-4 z-50 h-10 w-10 p-0"
        variant="outline"
        onClick={() => {
          setIsVisible(true);
          localStorage.removeItem('dev-tools-hidden');
        }}
        title="Show Development Tools"
      >
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      ref={dragRef as React.RefObject<HTMLDivElement>}
      style={style}
      className={`z-50 ${isDragging ? 'cursor-move' : ''}`}
    >
      <Card className={`shadow-xl border-2 transition-all duration-200 ${
        isDragging ? 'shadow-2xl border-blue-400' : 'shadow-lg border-gray-200'
      } ${isExpanded ? 'w-96' : 'w-80'}`}>
        {/* Draggable Header */}
        <div
          ref={handleRef as React.RefObject<HTMLDivElement>}
          className={`flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b cursor-move select-none ${
            isDragging ? 'bg-gradient-to-r from-blue-100 to-purple-100' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-gray-500" />
            <Settings className="h-4 w-4" />
            <span className="font-semibold text-sm">Development Tools</span>
            <Badge className={`${getEnvironmentColor()} text-white text-xs`}>
              {getEnvironmentIcon()}
              {state.environment.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
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
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpanded();
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
                handleClose();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <CardContent className="space-y-4 p-4">
            <CardDescription className="text-xs">
              🔧 Drag this window anywhere • Automation testing and mock controls
            </CardDescription>
            
            {/* Current Status */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                {state.mockMode ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
                <span>Mock Mode: {state.mockMode ? 'ON' : 'OFF'}</span>
              </div>
              <div className="flex items-center gap-1">
                {state.isDevelopment ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
                <span>Dev Mode: {state.isDevelopment ? 'ON' : 'OFF'}</span>
              </div>
            </div>

            {/* Mock Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium">Mock Automation</label>
                <p className="text-xs text-muted-foreground">
                  Use simulated data for testing
                </p>
              </div>
              <Switch
                checked={state.mockMode}
                onCheckedChange={toggleMockMode}
                className="ml-2"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={clearMockData}
                className="flex-1 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear Data
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = '/admin/automation-testing'}
                className="flex-1 text-xs"
              >
                <TestTube className="h-3 w-3 mr-1" />
                Test Dashboard
              </Button>
            </div>

            {/* Environment Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Environment: {state.environment}</div>
              <div>Mode: {import.meta.env.MODE}</div>
              <div>DEV: {state.isDevelopment ? 'true' : 'false'}</div>
              <div>Position: {Math.round(position.x)}, {Math.round(position.y)}</div>
              {state.mockMode && (
                <div className="text-blue-600 font-medium">
                  🎭 Mock services active
                </div>
              )}
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = '/draggable-demo'}
                      className="text-xs"
                    >
                      🪟 Draggable Demo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetPosition}
                      className="text-xs"
                    >
                      📍 Reset Position
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Debug Pages</h4>
                  <div className="space-y-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.location.href = '/debug/text-cleaner'}
                      className="w-full justify-start text-xs h-8"
                    >
                      🔧 Text Cleaner Debug
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.location.href = '/symbol-cleaner-debug'}
                      className="w-full justify-start text-xs h-8"
                    >
                      🔣 Symbol Cleaner Debug
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {state.mockMode && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-2">Mock Features Active:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Enhanced content generation</li>
                  <li>• Realistic processing delays</li>
                  <li>• Error simulation</li>
                  <li>• Performance testing</li>
                  <li>• Parallel processing</li>
                </ul>
              </div>
            )}
          </CardContent>
        )}

        {/* Resize indicator */}
        <div 
          className="absolute bottom-0 right-0 w-3 h-3 bg-gray-300 opacity-50 hover:opacity-100 transition-opacity" 
          style={{ clipPath: 'polygon(100% 0%, 0% 100%, 100% 100%)' }}
          title="Draggable • Click and drag to move"
        />
      </Card>
    </div>
  );
};

export default DraggableEnvironmentSwitcher;
