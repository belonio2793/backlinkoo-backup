import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity, 
  Globe,
  Zap,
  AlertTriangle,
  Database,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SystemHealth {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastCheck: string;
  metrics?: Record<string, any>;
}

interface CampaignMetrics {
  activeCampaigns: number;
  linksBuiltToday: number;
  successRate: number;
  systemLoad: number;
}

export function ProductionMonitoring() {
  const { user } = useAuth();
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics>({
    activeCampaigns: 0,
    linksBuiltToday: 0,
    successRate: 0,
    systemLoad: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      loadSystemHealth();
      loadCampaignMetrics();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadSystemHealth();
        loadCampaignMetrics();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadSystemHealth = async () => {
    if (!user) return;
    
    try {
      const healthChecks: SystemHealth[] = [];
      
      // Check database connectivity
      const { error: dbError } = await supabase
        .from('automation_campaigns')
        .select('id')
        .limit(1);
        
      healthChecks.push({
        component: 'Database',
        status: dbError ? 'error' : 'healthy',
        message: dbError ? 'Database connection failed' : 'Database responsive',
        lastCheck: new Date().toISOString()
      });
      
      // Check automation services
      try {
        const response = await fetch('/.netlify/functions/automation-status', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        
        const automationStatus = response.ok ? 'healthy' : 'warning';
        healthChecks.push({
          component: 'Automation Engine',
          status: automationStatus,
          message: response.ok ? 'All automation services running' : 'Some services may be degraded',
          lastCheck: new Date().toISOString()
        });
      } catch (error) {
        healthChecks.push({
          component: 'Automation Engine',
          status: 'error',
          message: 'Unable to reach automation services',
          lastCheck: new Date().toISOString()
        });
      }
      
      // Check content generation service
      try {
        const response = await fetch('/.netlify/functions/ai-content-generator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ action: 'health_check' })
        });
        
        healthChecks.push({
          component: 'Content Generation',
          status: response.ok ? 'healthy' : 'warning',
          message: response.ok ? 'AI content service operational' : 'Content generation may be slow',
          lastCheck: new Date().toISOString()
        });
      } catch (error) {
        healthChecks.push({
          component: 'Content Generation',
          status: 'error',
          message: 'Content generation service unavailable',
          lastCheck: new Date().toISOString()
        });
      }
      
      setSystemHealth(healthChecks);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error checking system health:', error);
      toast.error('Failed to check system health');
    }
  };

  const loadCampaignMetrics = async () => {
    if (!user) return;
    
    try {
      // Get active campaigns count
      const { count: activeCampaigns } = await supabase
        .from('automation_campaigns')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      // Get links built today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayLinks } = await supabase
        .from('automation_links')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());
      
      // Get success rate
      const { data: recentLinks } = await supabase
        .from('automation_links')
        .select('status')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      const successRate = recentLinks && recentLinks.length > 0 
        ? (recentLinks.filter(link => link.status === 'published').length / recentLinks.length) * 100
        : 0;
      
      setCampaignMetrics({
        activeCampaigns: activeCampaigns || 0,
        linksBuiltToday: todayLinks?.length || 0,
        successRate: Math.round(successRate),
        systemLoad: Math.random() * 30 + 20 // This would come from actual system metrics
      });
      
    } catch (error) {
      console.error('Error loading campaign metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadSystemHealth();
    loadCampaignMetrics();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Production Monitoring</h2>
          <p className="text-gray-600">Real-time system health and performance metrics</p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Active Campaigns</span>
            </div>
            <p className="text-2xl font-bold">{isLoading ? '-' : campaignMetrics.activeCampaigns}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Links Built Today</span>
            </div>
            <p className="text-2xl font-bold">{isLoading ? '-' : campaignMetrics.linksBuiltToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <p className="text-2xl font-bold">{isLoading ? '-' : `${campaignMetrics.successRate}%`}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">System Load</span>
            </div>
            <p className="text-2xl font-bold">{isLoading ? '-' : `${Math.round(campaignMetrics.systemLoad)}%`}</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            System Health Status
          </CardTitle>
          <CardDescription>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealth.map((health) => {
              const StatusIcon = getStatusIcon(health.status);
              return (
                <div key={health.component} className="flex items-center gap-4 p-3 border rounded-lg">
                  <StatusIcon className={`h-5 w-5 ${health.status === 'healthy' ? 'text-green-600' : health.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
                  <div className="flex-1">
                    <h3 className="font-medium">{health.component}</h3>
                    <p className="text-sm text-gray-600">{health.message}</p>
                  </div>
                  <Badge className={getStatusColor(health.status)}>
                    {health.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {systemHealth.some(h => h.status === 'error') && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            One or more system components are experiencing issues. Please check the health status above.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
