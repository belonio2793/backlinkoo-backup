import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  Activity, 
  Zap, 
  AlertTriangle, 
  Settings,
  ChevronDown,
  ChevronUp,
  Monitor
} from 'lucide-react';
import { AutomationDebugDashboard } from './AutomationDebugDashboard';
import { activeLogger, debugLog } from '@/services/activeErrorLogger';
import { errorCategorization } from '@/services/errorCategorization';
import { monitoringAlerts } from '@/services/monitoringAlerts';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AutomationWithDebuggingProps {
  children: React.ReactNode;
  enabledInProduction?: boolean;
}

export function AutomationWithDebugging({ 
  children, 
  enabledInProduction = false 
}: AutomationWithDebuggingProps) {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const { user, isPremium } = useAuth();
  
  // Only show debug panel in development or if explicitly enabled in production
  const shouldShowDebugPanel = import.meta.env.DEV || enabledInProduction;

  useEffect(() => {
    if (shouldShowDebugPanel) {
      // Initialize debugging systems
      debugLog.info('automation_debugging', 'initialize', 'Automation debugging system initialized', {
        userId: user?.id,
        isPremium,
        environment: import.meta.env.MODE
      });

      // Initialize error categorization system for production monitoring
      debugLog.info('automation_debugging', 'system_initialization', 'Production error monitoring initialized', {
        environment: import.meta.env.MODE,
        userId: user?.id
      });
    }
  }, [shouldShowDebugPanel, user?.id, isPremium]);

  const getSystemHealthStatus = () => {
    const health = errorCategorization.getAutomationHealthScore();
    const alerts = monitoringAlerts.getAlertStatistics();
    
    return {
      score: health.score,
      alerts: alerts.unresolvedTriggers,
      status: health.score >= 80 ? 'healthy' : health.score >= 60 ? 'warning' : 'critical'
    };
  };

  const healthStatus = getSystemHealthStatus();

  const getHealthBadge = () => {
    switch (healthStatus.status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
          Healthy ({healthStatus.score}%)
        </Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          Warning ({healthStatus.score}%)
        </Badge>;
      case 'critical':
        return <Badge variant="destructive">
          Critical ({healthStatus.score}%)
        </Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleToggleDebugMode = () => {
    setDebugMode(!debugMode);
    
    if (!debugMode) {
      debugLog.info('automation_debugging', 'debug_mode_enabled', 'Debug mode enabled by user');
      toast.success('Debug mode enabled', {
        description: 'Enhanced error logging and monitoring is now active'
      });
    } else {
      debugLog.info('automation_debugging', 'debug_mode_disabled', 'Debug mode disabled by user');
      toast.info('Debug mode disabled');
    }
  };

  if (!shouldShowDebugPanel) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Debug Control Panel */}
      <div className="fixed top-4 right-4 z-50">
        <Card className="w-80 shadow-lg border-2 border-blue-200 bg-blue-50/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Debug Control</span>
                {getHealthBadge()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="h-6 w-6 p-0"
              >
                {showDebugPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {healthStatus.alerts > 0 && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {healthStatus.alerts} unresolved alert{healthStatus.alerts > 1 ? 's' : ''}
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          
          {showDebugPanel && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Debug Mode:</span>
                  <Button
                    variant={debugMode ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleDebugMode}
                    className="h-6 text-xs"
                  >
                    {debugMode ? 'ON' : 'OFF'}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-medium text-blue-600">{healthStatus.score}%</div>
                    <div className="text-gray-500">Health</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="font-medium text-red-600">{healthStatus.alerts}</div>
                    <div className="text-gray-500">Alerts</div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebugPanel(false)}
                  className="w-full h-6 text-xs"
                >
                  <Monitor className="h-3 w-3 mr-1" />
                  Open Full Dashboard
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Main content */}
      <div className={debugMode ? 'debug-mode-active' : ''}>
        {children}
      </div>

      {/* Full Debug Dashboard Modal */}
      {!showDebugPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold">Automation Debug Dashboard</h2>
                  <p className="text-sm text-gray-600">Real-time debugging and monitoring</p>
                </div>
                {getHealthBadge()}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDebugPanel(true)}
              >
                Close Dashboard
              </Button>
            </div>
            
            <div className="p-4 h-full overflow-auto">
              <AutomationDebugDashboard />
            </div>
          </div>
        </div>
      )}

      {/* CSS for debug mode styling */}
      <style jsx>{`
        .debug-mode-active {
          position: relative;
        }
        
        .debug-mode-active::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
          background-size: 200% 100%;
          animation: debugPulse 2s linear infinite;
          z-index: 9999;
        }
        
        @keyframes debugPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export default AutomationWithDebugging;
