import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  TestTube,
  RefreshCw
} from 'lucide-react';

interface EnvironmentState {
  mockMode: boolean;
  testMode: boolean;
  environment: string;
  isDevelopment: boolean;
}

const EnvironmentSwitcher: React.FC = () => {
  const [state, setState] = useState<EnvironmentState>({
    mockMode: localStorage.getItem('automation-mock-mode') === 'true',
    testMode: import.meta.env.MODE === 'test',
    environment: import.meta.env.MODE || 'development',
    isDevelopment: import.meta.env.DEV || false
  });

  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  useEffect(() => {
    setIsVisible(state.isDevelopment || state.environment === 'development');
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

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Development Tools
            </CardTitle>
            <Badge className={`${getEnvironmentColor()} text-white`}>
              {getEnvironmentIcon()}
              {state.environment.toUpperCase()}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Automation testing and mock controls
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
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
            {state.mockMode && (
              <div className="text-blue-600 font-medium">
                🎭 Mock services active
              </div>
            )}
          </div>

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
      </Card>
    </div>
  );
};

export default EnvironmentSwitcher;
