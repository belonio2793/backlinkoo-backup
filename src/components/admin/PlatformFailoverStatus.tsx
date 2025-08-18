import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  AlertTriangle,
  Zap,
  Activity,
  TrendingUp
} from 'lucide-react';
import { getAllPlatforms } from '@/services/platformConfigs';

interface PlatformAttempt {
  platform: string;
  status: 'pending' | 'trying' | 'success' | 'failed' | 'skipped';
  error?: string;
  timestamp: Date;
  domainAuthority: number;
  cost: number;
}

interface FailoverSimulation {
  id: string;
  taskName: string;
  attempts: PlatformAttempt[];
  currentAttempt: number;
  isRunning: boolean;
  finalResult?: 'success' | 'failed';
  startTime: Date;
  endTime?: Date;
}

export function PlatformFailoverStatus() {
  const [simulations, setSimulations] = useState<FailoverSimulation[]>([]);
  const [platforms] = useState(getAllPlatforms());

  const createFailoverSimulation = () => {
    const taskId = Math.random().toString(36).substr(2, 9);
    const availablePlatforms = platforms.filter(p => p.apiAvailable);
    
    const attempts: PlatformAttempt[] = availablePlatforms.map(platform => ({
      platform: platform.id,
      status: 'pending',
      timestamp: new Date(),
      domainAuthority: platform.domainAuthority,
      cost: platform.costPerPost
    }));

    const simulation: FailoverSimulation = {
      id: taskId,
      taskName: `Campaign Task ${taskId}`,
      attempts,
      currentAttempt: 0,
      isRunning: true,
      startTime: new Date()
    };

    setSimulations(prev => [simulation, ...prev.slice(0, 2)]); // Keep only 3 simulations
    runFailoverSimulation(simulation);
  };

  const runFailoverSimulation = async (simulation: FailoverSimulation) => {
    const { attempts } = simulation;
    
    for (let i = 0; i < attempts.length; i++) {
      // Update current attempt
      setSimulations(prev => prev.map(s => 
        s.id === simulation.id 
          ? { ...s, currentAttempt: i, attempts: attempts.map((attempt, idx) => 
              idx === i ? { ...attempt, status: 'trying' } : attempt
            )}
          : s
      ));

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time

      // Simulate different outcomes based on platform characteristics
      const platform = platforms.find(p => p.id === attempts[i].platform);
      const success = simulatePlatformResult(platform, i);

      if (success) {
        // Success - stop trying other platforms
        setSimulations(prev => prev.map(s => 
          s.id === simulation.id 
            ? { 
                ...s, 
                isRunning: false,
                finalResult: 'success',
                endTime: new Date(),
                attempts: attempts.map((attempt, idx) => 
                  idx === i 
                    ? { ...attempt, status: 'success', timestamp: new Date() }
                    : idx > i 
                      ? { ...attempt, status: 'skipped' }
                      : attempt
                )
              }
            : s
        ));
        return;
      } else {
        // Failed - try next platform
        const errorMessages = [
          'Rate limit exceeded',
          'Authentication failed',
          'Content policy violation',
          'Service temporarily unavailable',
          'Invalid API key',
          'Network timeout'
        ];
        
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        
        setSimulations(prev => prev.map(s => 
          s.id === simulation.id 
            ? { 
                ...s, 
                attempts: attempts.map((attempt, idx) => 
                  idx === i 
                    ? { ...attempt, status: 'failed', error: randomError, timestamp: new Date() }
                    : attempt
                )
              }
            : s
        ));

        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause before next attempt
      }
    }

    // All platforms failed
    setSimulations(prev => prev.map(s => 
      s.id === simulation.id 
        ? { 
            ...s, 
            isRunning: false,
            finalResult: 'failed',
            endTime: new Date()
          }
        : s
    ));
  };

  const simulatePlatformResult = (platform: any, attemptIndex: number): boolean => {
    if (!platform) return false;
    
    // Telegraph has highest success rate (it's always working)
    if (platform.id === 'telegraph') return true;
    
    // Medium and Dev.to have good success rates
    if (platform.id === 'medium' || platform.id === 'devto') {
      return Math.random() > 0.3; // 70% success rate
    }
    
    // Other platforms have moderate success rates
    return Math.random() > 0.6; // 40% success rate
  };

  const getStatusIcon = (status: PlatformAttempt['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'trying': return <RotateCcw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'skipped': return <ArrowRight className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PlatformAttempt['status']) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-600">Success</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'trying': return <Badge variant="default" className="bg-blue-600">Trying...</Badge>;
      case 'skipped': return <Badge variant="secondary">Skipped</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const calculateProgress = (simulation: FailoverSimulation): number => {
    if (simulation.finalResult) return 100;
    if (!simulation.isRunning) return 0;
    return (simulation.currentAttempt / simulation.attempts.length) * 100;
  };

  const getSimulationStatus = (simulation: FailoverSimulation): { message: string; variant: 'default' | 'destructive' | 'secondary' } => {
    if (simulation.finalResult === 'success') {
      return { message: 'Published Successfully', variant: 'default' };
    }
    if (simulation.finalResult === 'failed') {
      return { message: 'All Platforms Failed', variant: 'destructive' };
    }
    if (simulation.isRunning) {
      const currentPlatform = simulation.attempts[simulation.currentAttempt]?.platform;
      return { message: `Trying ${currentPlatform}...`, variant: 'secondary' };
    }
    return { message: 'Ready to Start', variant: 'secondary' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Failover Status</h2>
        <p className="text-gray-600">
          Monitor how the system automatically tries multiple platforms until successful publication
        </p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium">Automatic Failover</div>
                <div className="text-sm text-gray-600">Tries all platforms sequentially</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">No Campaign Pause</div>
                <div className="text-sm text-gray-600">Continues until success or exhaustion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="font-medium">Smart Prioritization</div>
                <div className="text-sm text-gray-600">Tries highest DA platforms first</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Failover Simulation</CardTitle>
          <CardDescription>
            Simulate how the engine handles platform failures and automatically tries alternatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={createFailoverSimulation} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Run Failover Simulation
          </Button>
        </CardContent>
      </Card>

      {/* Active Simulations */}
      {simulations.map(simulation => (
        <Card key={simulation.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{simulation.taskName}</CardTitle>
              <Badge variant={getSimulationStatus(simulation).variant}>
                {getSimulationStatus(simulation).message}
              </Badge>
            </div>
            <CardDescription>
              Started: {simulation.startTime.toLocaleTimeString()}
              {simulation.endTime && ` • Completed: ${simulation.endTime.toLocaleTimeString()}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Platform Attempts</span>
                <span>{simulation.currentAttempt + 1}/{simulation.attempts.length}</span>
              </div>
              <Progress value={calculateProgress(simulation)} className="w-full" />
            </div>

            {/* Platform Attempts */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Platform Attempts (in order of priority):</h4>
              {simulation.attempts.map((attempt, index) => (
                <div 
                  key={attempt.platform} 
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    index === simulation.currentAttempt && simulation.isRunning ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(attempt.status)}
                    <div>
                      <div className="font-medium capitalize">{attempt.platform}</div>
                      <div className="text-xs text-gray-600">
                        DA: {attempt.domainAuthority} • Cost: ${attempt.cost}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {attempt.error && (
                      <div className="text-xs text-red-600 max-w-32 truncate" title={attempt.error}>
                        {attempt.error}
                      </div>
                    )}
                    {getStatusBadge(attempt.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Final Result */}
            {simulation.finalResult && (
              <div className={`p-3 rounded-lg ${
                simulation.finalResult === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className={`flex items-center gap-2 font-medium ${
                  simulation.finalResult === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {simulation.finalResult === 'success' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Campaign continued successfully after {simulation.currentAttempt + 1} attempts
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      All {simulation.attempts.length} platforms exhausted - task would be retried later
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            How Platform Failover Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>Priority Order:</strong> Platforms are tried in order of Domain Authority and suitability score</p>
          <p>• <strong>Automatic Retry:</strong> If one platform fails, the system immediately tries the next available platform</p>
          <p>• <strong>No Campaign Pause:</strong> Campaigns continue running even if individual platforms fail</p>
          <p>• <strong>Comprehensive Attempt:</strong> ALL available platforms are tried before considering the task failed</p>
          <p>• <strong>Detailed Logging:</strong> Each failure is logged with specific error details for troubleshooting</p>
          <p>• <strong>Smart Recovery:</strong> Failed platforms are temporarily avoided while successful ones are prioritized</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlatformFailoverStatus;
