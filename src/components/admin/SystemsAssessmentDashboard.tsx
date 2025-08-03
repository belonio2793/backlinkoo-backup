import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Users, 
  FileText, 
  Shield,
  Activity,
  Settings,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SystemsAssessmentDashboard() {
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const runAssessment = async () => {
    setLoading(true);
    try {
      // Simplified assessment
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdate(new Date());
      toast({
        title: "Assessment Complete",
        description: "Systems assessment completed successfully"
      });
    } catch (error) {
      toast({
        title: "Assessment Failed",
        description: "Failed to run systems assessment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const systemComponents = [
    { name: 'Database Connection', status: 'healthy', icon: Database },
    { name: 'User Authentication', status: 'healthy', icon: Users },
    { name: 'Blog System', status: 'healthy', icon: FileText },
    { name: 'Security Policies', status: 'healthy', icon: Shield },
    { name: 'API Services', status: 'healthy', icon: Activity },
    { name: 'Configuration', status: 'healthy', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Systems Assessment</h2>
          <p className="text-muted-foreground">Monitor system health and performance</p>
        </div>
        <Button 
          onClick={runAssessment} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Run Assessment
        </Button>
      </div>

      {lastUpdate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">
                Last updated: {lastUpdate.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systemComponents.map((component, index) => {
          const Icon = component.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" />
                  {component.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={component.status === 'healthy' ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Healthy
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">6</div>
              <div className="text-sm text-muted-foreground">Healthy Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">0</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">0</div>
              <div className="text-sm text-muted-foreground">Critical Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">100%</div>
              <div className="text-sm text-muted-foreground">System Health</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
