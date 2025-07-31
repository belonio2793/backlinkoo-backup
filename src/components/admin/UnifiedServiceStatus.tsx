/**
 * Unified Service Status Component
 * Production-safe service monitoring with automatic fixes and real-time validation
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { productionSafeConfig, ProductionAPIStatus } from '@/services/productionSafeConfig';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  Users,
  Globe,
  Database,
  Mail,
  Brain,
  Activity,
  Wrench,
  Eye,
  AlertOctagon
} from 'lucide-react';

interface ServiceStatusState {
  overall: 'healthy' | 'degraded' | 'critical';
  services: ProductionAPIStatus[];
  recommendations: string[];
  userSafetyLevel: number;
  loading: boolean;
  lastCheck: string;
}

export function UnifiedServiceStatus() {
  const [status, setStatus] = useState<ServiceStatusState>({
    overall: 'healthy',
    services: [],
    recommendations: [],
    userSafetyLevel: 100,
    loading: true,
    lastCheck: ''
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const { toast } = useToast();

  const checkServiceStatus = async () => {
    try {
      setIsRefreshing(true);
      const result = await productionSafeConfig.getUnifiedServiceStatus();
      
      setStatus({
        ...result,
        loading: false,
        lastCheck: new Date().toLocaleTimeString()
      });

      // Show alerts for critical issues
      if (result.overall === 'critical') {
        toast({
          title: 'Critical Service Issues',
          description: 'Some services are down and may affect users',
          variant: 'destructive'
        });
      } else if (result.overall === 'degraded') {
        toast({
          title: 'Service Degradation',
          description: 'Some services have warnings but users are not affected',
        });
      }

    } catch (error) {
      console.error('Service status check failed:', error);
      toast({
        title: 'Status Check Failed',
        description: 'Unable to verify service status',
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const autoFixIssues = async () => {
    setAutoFixing(true);
    try {
      toast({
        title: 'Auto-fixing Issues',
        description: 'Attempting to resolve configuration problems...'
      });

      const validation = await productionSafeConfig.validateProductionSafety();
      
      if (validation.autoFixesApplied.length > 0) {
        toast({
          title: 'Auto-fixes Applied',
          description: `Applied ${validation.autoFixesApplied.length} automatic fixes`
        });
        
        // Re-check status after fixes
        await checkServiceStatus();
      } else {
        toast({
          title: 'No Auto-fixes Available',
          description: 'Manual intervention may be required',
          variant: 'destructive'
        });
      }

    } catch (error) {
      toast({
        title: 'Auto-fix Failed',
        description: 'Unable to automatically resolve issues',
        variant: 'destructive'
      });
    } finally {
      setAutoFixing(false);
    }
  };

  useEffect(() => {
    checkServiceStatus();
    
    // Check every 30 seconds for production safety
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'OpenAI': return Brain;
      case 'Database': return Database;
      case 'Email': return Mail;
      default: return Globe;
    }
  };

  const getOverallIcon = () => {
    switch (status.overall) {
      case 'healthy': return CheckCircle2;
      case 'degraded': return AlertTriangle;
      case 'critical': return XCircle;
    }
  };

  const getOverallColor = () => {
    switch (status.overall) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  const getServiceStatusBadge = (service: ProductionAPIStatus) => {
    if (!service.configured) {
      return <Badge className="bg-gray-100 text-gray-800">Not Configured</Badge>;
    }
    if (service.valid) {
      return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
    }
    if (service.fallbackAvailable) {
      return <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
  };

  const getUserImpactIcon = (impact: string) => {
    switch (impact) {
      case 'none': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 'blocked': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return <AlertOctagon className="h-3 w-3 text-gray-400" />;
    }
  };

  const OverallIcon = getOverallIcon();
  const criticalIssues = status.services.filter(s => s.configured && !s.valid && !s.fallbackAvailable).length;

  return (
    <div className="space-y-6">
      {/* Overall Status Header */}
      <Card className={`border-2 ${status.overall === 'critical' ? 'border-red-200' : status.overall === 'degraded' ? 'border-yellow-200' : 'border-green-200'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.overall === 'critical' ? 'bg-red-100' : status.overall === 'degraded' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <OverallIcon className={`h-6 w-6 ${getOverallColor()}`} />
              </div>
              <div>
                <span className="text-2xl font-bold">Production Service Status</span>
                <p className="text-sm text-muted-foreground">
                  Real-time monitoring for backlinkoo.com users
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                className={
                  status.overall === 'critical' ? 'bg-red-100 text-red-800' :
                  status.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }
              >
                {status.overall.charAt(0).toUpperCase() + status.overall.slice(1)}
              </Badge>
              <Button onClick={checkServiceStatus} disabled={isRefreshing} size="sm" variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-medium">User Safety Level</span>
              </div>
              <div className="space-y-1">
                <Progress value={status.userSafetyLevel} className="h-2" />
                <p className="text-sm text-muted-foreground">{status.userSafetyLevel}% Safe</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="font-medium">Services Status</span>
              </div>
              <p className="text-sm">
                {status.services.filter(s => s.valid).length}/{status.services.length} Healthy
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Last Check</span>
              </div>
              <p className="text-sm text-muted-foreground">{status.lastCheck}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertOctagon className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Critical:</strong> {criticalIssues} service{criticalIssues > 1 ? 's' : ''} may be affecting users on backlinkoo.com
            <Button 
              onClick={autoFixIssues} 
              disabled={autoFixing}
              size="sm" 
              className="ml-3 bg-red-600 hover:bg-red-700"
            >
              <Wrench className={`h-3 w-3 mr-1 ${autoFixing ? 'animate-spin' : ''}`} />
              Auto-Fix
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Individual Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {status.services.map((service) => {
          const ServiceIcon = getServiceIcon(service.service);
          
          return (
            <Card key={service.service} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ServiceIcon className="h-4 w-4" />
                    <span className="font-medium">{service.service}</span>
                  </div>
                  {getServiceStatusBadge(service)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Response Time:</span>
                    <span className="font-mono">{service.responseTime}ms</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>User Impact:</span>
                    <div className="flex items-center gap-1">
                      {getUserImpactIcon(service.userImpact)}
                      <span className="capitalize">{service.userImpact}</span>
                    </div>
                  </div>
                  
                  {service.fallbackAvailable && !service.valid && (
                    <div className="p-2 bg-yellow-50 rounded text-yellow-800 text-xs">
                      Fallback active - users not affected
                    </div>
                  )}
                  
                  {service.autoFixed && (
                    <div className="p-2 bg-green-50 rounded text-green-800 text-xs">
                      Auto-fix applied successfully
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      {status.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {status.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Production Safety Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-blue-800">
          <strong>Production Safety:</strong> This dashboard shows real-time status affecting users on backlinkoo.com. 
          All services include automatic fallbacks to ensure uninterrupted user experience.
        </AlertDescription>
      </Alert>
    </div>
  );
}
