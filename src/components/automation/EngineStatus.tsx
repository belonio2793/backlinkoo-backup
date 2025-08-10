import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Engine {
  id: string;
  name: string;
  icon: any;
  status: string;
  taskCount: number;
  successRate: number;
  description: string;
}

interface EngineStatusProps {
  engines: Engine[];
}

export function EngineStatus({ engines }: EngineStatusProps) {
  const [engineStates, setEngineStates] = useState(() => 
    engines.reduce((acc, engine) => {
      acc[engine.id] = {
        ...engine,
        enabled: engine.status === 'active',
        metrics: {
          avgProcessingTime: Math.floor(Math.random() * 60) + 30,
          tasksPerHour: Math.floor(Math.random() * 20) + 5,
          lastActivity: `${Math.floor(Math.random() * 30) + 1} min ago`,
          uptime: `${Math.floor(Math.random() * 24) + 1}h ${Math.floor(Math.random() * 60)}m`
        }
      };
      return acc;
    }, {} as Record<string, any>)
  );

  const toggleEngine = (engineId: string) => {
    setEngineStates(prev => ({
      ...prev,
      [engineId]: {
        ...prev[engineId],
        enabled: !prev[engineId].enabled,
        status: prev[engineId].enabled ? 'paused' : 'active'
      }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'idle': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'idle': return 'outline';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Engine Status</h2>
          <p className="text-gray-600">Monitor and control individual automation engines</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {/* Engine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.values(engineStates).map((engine: any) => {
          const IconComponent = engine.icon;
          return (
            <Card key={engine.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{engine.name}</CardTitle>
                      <CardDescription>{engine.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(engine.status)}`} />
                    <Badge variant={getStatusBadgeVariant(engine.status)}>
                      {engine.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Engine Control */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={engine.enabled}
                        onCheckedChange={() => toggleEngine(engine.id)}
                      />
                      <span className="text-sm font-medium">
                        {engine.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleEngine(engine.id)}
                      >
                        {engine.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Task Count</span>
                      </div>
                      <p className="text-2xl font-bold">{engine.taskCount}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Success Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{engine.successRate}%</p>
                    </div>
                  </div>

                  {/* Success Rate Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Performance</span>
                      <span className={engine.successRate >= 90 ? 'text-green-600' : 'text-yellow-600'}>
                        {engine.successRate >= 90 ? 'Excellent' : 'Good'}
                      </span>
                    </div>
                    <Progress 
                      value={engine.successRate} 
                      className="h-2"
                    />
                  </div>

                  {/* Detailed Metrics */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">Avg Time</span>
                      </div>
                      <p className="text-sm font-medium">{engine.metrics.avgProcessingTime}s</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">Per Hour</span>
                      </div>
                      <p className="text-sm font-medium">{engine.metrics.tasksPerHour}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">Last Activity</span>
                      </div>
                      <p className="text-sm font-medium">{engine.metrics.lastActivity}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-600">Uptime</span>
                      </div>
                      <p className="text-sm font-medium">{engine.metrics.uptime}</p>
                    </div>
                  </div>

                  {/* Engine-specific alerts */}
                  {engine.successRate < 85 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">
                        Performance below threshold. Consider reviewing settings.
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Summary</CardTitle>
          <CardDescription>Overall automation system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(engineStates).filter((e: any) => e.enabled).length}
              </div>
              <p className="text-sm text-gray-600">Active Engines</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(engineStates).reduce((sum: number, e: any) => sum + e.taskCount, 0)}
              </div>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(Object.values(engineStates).reduce((sum: number, e: any) => sum + e.successRate, 0) / engines.length).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Avg Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(engineStates).reduce((sum: number, e: any) => sum + e.metrics.tasksPerHour, 0)}
              </div>
              <p className="text-sm text-gray-600">Tasks/Hour</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
