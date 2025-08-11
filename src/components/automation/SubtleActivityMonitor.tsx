import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Globe, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Cpu,
  HardDrive,
  Wifi,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemOperation {
  id: number;
  operation_id: string;
  operation_type: string;
  operation_subtype?: string;
  status: 'started' | 'processing' | 'completed' | 'failed' | 'retrying';
  priority: number;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  compute_cost: number;
  success_rate?: number;
  error_message?: string;
  operation_data: any;
  result_data: any;
  hosting_impact: {
    cpu_usage?: number;
    memory_usage?: number;
    bandwidth_usage?: number;
  };
}

interface ActivitySummary {
  active_operations: number;
  completed_operations: number;
  failed_operations: number;
  total_compute_cost: number;
  avg_success_rate: number;
  system_load: {
    cpu: number;
    memory: number;
    bandwidth: number;
  };
}

interface SubtleActivityMonitorProps {
  campaignId?: string;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  showDetails?: boolean;
  autoHide?: boolean;
  updateInterval?: number;
}

export function SubtleActivityMonitor({
  campaignId,
  position = 'top-right',
  showDetails = false,
  autoHide = true,
  updateInterval = 5000
}: SubtleActivityMonitorProps) {
  const [operations, setOperations] = useState<SystemOperation[]>([]);
  const [summary, setSummary] = useState<ActivitySummary>({
    active_operations: 0,
    completed_operations: 0,
    failed_operations: 0,
    total_compute_cost: 0,
    avg_success_rate: 0,
    system_load: { cpu: 0, memory: 0, bandwidth: 0 }
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Load system operations
  const loadOperations = useCallback(async () => {
    try {
      let query = supabase
        .from('system_operations')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(20);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading operations:', error);
        return;
      }

      setOperations(data || []);
      
      // Calculate summary
      const activeOps = data?.filter(op => op.status === 'processing' || op.status === 'started') || [];
      const completedOps = data?.filter(op => op.status === 'completed') || [];
      const failedOps = data?.filter(op => op.status === 'failed') || [];
      
      const totalComputeCost = data?.reduce((sum, op) => sum + (op.compute_cost || 0), 0) || 0;
      const avgSuccessRate = data?.length > 0 ? 
        data.reduce((sum, op) => sum + (op.success_rate || 0), 0) / data.length : 0;

      // Simulate system load (in production, this would come from actual monitoring)
      const systemLoad = {
        cpu: Math.min(activeOps.length * 10 + Math.random() * 20, 100),
        memory: Math.min(activeOps.length * 15 + Math.random() * 30, 100),
        bandwidth: Math.min(activeOps.length * 5 + Math.random() * 15, 100)
      };

      setSummary({
        active_operations: activeOps.length,
        completed_operations: completedOps.length,
        failed_operations: failedOps.length,
        total_compute_cost: totalComputeCost,
        avg_success_rate: avgSuccessRate,
        system_load: systemLoad
      });

      setLastUpdate(new Date());

      // Auto-hide if no activity and autoHide is enabled
      if (autoHide && activeOps.length === 0 && completedOps.length === 0) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

    } catch (error) {
      console.error('Error in loadOperations:', error);
    }
  }, [campaignId, autoHide]);

  // Real-time subscription
  useEffect(() => {
    // Load initial data
    loadOperations();

    // Set up real-time subscription
    const channel = supabase
      .channel('system_operations_monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_operations'
        },
        () => {
          loadOperations(); // Reload data when changes occur
        }
      )
      .subscribe();

    // Set up periodic updates
    const interval = setInterval(loadOperations, updateInterval);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [loadOperations, updateInterval]);

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 transition-all duration-300';
    
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  const getOperationIcon = (operation: SystemOperation) => {
    switch (operation.operation_type) {
      case 'url_discovery': return Globe;
      case 'content_posting': return Zap;
      case 'verification': return Eye;
      case 'sync': return Database;
      case 'compute': return Cpu;
      default: return Activity;
    }
  };

  const getStatusColor = (status: SystemOperation['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'processing': return 'text-blue-600';
      case 'retrying': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: SystemOperation['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return AlertCircle;
      case 'processing': return Clock;
      case 'retrying': return Clock;
      default: return Activity;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatComputeCost = (cost: number) => {
    if (cost < 0.001) return '< 0.001';
    return cost.toFixed(4);
  };

  if (!isVisible) {
    return (
      <div className={getPositionClasses()}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm shadow-sm border"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={getPositionClasses()}>
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border max-w-sm">
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">System Monitor</span>
              {summary.active_operations > 0 && (
                <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  {summary.active_operations} Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            <div className="text-center">
              <div className="text-green-600 font-medium">{summary.completed_operations}</div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-medium">{summary.failed_operations}</div>
              <div className="text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-medium">{formatComputeCost(summary.total_compute_cost)}</div>
              <div className="text-gray-500">Compute</div>
            </div>
          </div>

          {/* System Load */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                <span>CPU</span>
              </div>
              <span className="text-gray-500">{summary.system_load.cpu.toFixed(0)}%</span>
            </div>
            <Progress value={summary.system_load.cpu} className="h-1" />
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                <span>Memory</span>
              </div>
              <span className="text-gray-500">{summary.system_load.memory.toFixed(0)}%</span>
            </div>
            <Progress value={summary.system_load.memory} className="h-1" />
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                <span>Network</span>
              </div>
              <span className="text-gray-500">{summary.system_load.bandwidth.toFixed(0)}%</span>
            </div>
            <Progress value={summary.system_load.bandwidth} className="h-1" />
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="border-t pt-2">
              <div className="text-xs text-gray-500 mb-2">Recent Operations</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {operations.slice(0, 5).map((operation) => {
                  const OperationIcon = getOperationIcon(operation);
                  const StatusIcon = getStatusIcon(operation.status);
                  
                  return (
                    <div key={operation.id} className="flex items-center justify-between text-xs p-1 rounded bg-gray-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <OperationIcon className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{operation.operation_subtype || operation.operation_type}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <StatusIcon className={`h-3 w-3 ${getStatusColor(operation.status)}`} />
                        <span className="text-gray-500">{formatDuration(operation.duration_ms)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {lastUpdate && (
                <div className="text-xs text-gray-400 mt-2 text-center">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {/* Active Operations Indicator */}
          {summary.active_operations > 0 && !isExpanded && (
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1 animate-pulse" />
              {summary.active_operations} operation{summary.active_operations !== 1 ? 's' : ''} running
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Quick stats component for inline use
export function InlineActivityStats({ campaignId }: { campaignId?: string }) {
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    failed: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        let query = supabase
          .from('system_operations')
          .select('status')
          .gte('start_time', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

        if (campaignId) {
          query = query.eq('campaign_id', campaignId);
        }

        const { data } = await query;

        if (data) {
          setStats({
            active: data.filter(op => op.status === 'processing' || op.status === 'started').length,
            completed: data.filter(op => op.status === 'completed').length,
            failed: data.filter(op => op.status === 'failed').length
          });
        }
      } catch (error) {
        console.error('Error loading inline stats:', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [campaignId]);

  return (
    <div className="flex items-center gap-2 text-xs">
      {stats.active > 0 && (
        <Badge variant="default" className="bg-blue-100 text-blue-700">
          <Activity className="h-2 w-2 mr-1" />
          {stats.active} Active
        </Badge>
      )}
      {stats.completed > 0 && (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          <CheckCircle className="h-2 w-2 mr-1" />
          {stats.completed}
        </Badge>
      )}
      {stats.failed > 0 && (
        <Badge variant="destructive" className="bg-red-100 text-red-700">
          <AlertCircle className="h-2 w-2 mr-1" />
          {stats.failed}
        </Badge>
      )}
    </div>
  );
}

// Floating mini indicator
export function FloatingActivityIndicator({ campaignId }: { campaignId?: string }) {
  const [hasActivity, setHasActivity] = useState(false);

  useEffect(() => {
    const checkActivity = async () => {
      try {
        let query = supabase
          .from('system_operations')
          .select('id')
          .in('status', ['processing', 'started'])
          .limit(1);

        if (campaignId) {
          query = query.eq('campaign_id', campaignId);
        }

        const { data } = await query;
        setHasActivity(data && data.length > 0);
      } catch (error) {
        console.error('Error checking activity:', error);
      }
    };

    checkActivity();
    const interval = setInterval(checkActivity, 3000);

    return () => clearInterval(interval);
  }, [campaignId]);

  if (!hasActivity) return null;

  return (
    <div className="fixed top-4 right-20 z-40">
      <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
        <Activity className="h-3 w-3" />
        Processing
      </div>
    </div>
  );
}
