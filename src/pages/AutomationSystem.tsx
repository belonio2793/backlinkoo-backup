import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Pause, 
  Settings, 
  BarChart3, 
  MessageSquare, 
  PenTool, 
  Users, 
  Share2, 
  Globe, 
  Mail,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { NavigationHeader } from '@/components/shared/NavigationHeader';
import { useNavigate } from 'react-router-dom';

export default function AutomationSystem() {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState('stopped');
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: 0,
    successRate: 98.2,
    averageTaskTime: 45,
    actionsPerHour: 24
  });

  const engines = [
    { 
      id: 'blog-commenting', 
      name: 'Blog Commenting', 
      icon: MessageSquare, 
      status: 'active',
      taskCount: 142,
      successRate: 96.8,
      description: 'AI-powered contextual blog comment generation'
    },
    { 
      id: 'blog-posting', 
      name: 'Blog Posting', 
      icon: PenTool, 
      status: 'active',
      taskCount: 23,
      successRate: 94.2,
      description: 'Automated blog post creation and publishing'
    },
    { 
      id: 'forum-profiles', 
      name: 'Forum Profiles', 
      icon: Users, 
      status: 'idle',
      taskCount: 8,
      successRate: 98.1,
      description: 'Automated forum profile creation and management'
    },
    { 
      id: 'social-media', 
      name: 'Social Media', 
      icon: Share2, 
      status: 'active',
      taskCount: 67,
      successRate: 92.4,
      description: 'Multi-platform social media content posting'
    },
    { 
      id: 'web2', 
      name: 'Web 2.0', 
      icon: Globe, 
      status: 'paused',
      taskCount: 15,
      successRate: 89.7,
      description: 'Web 2.0 site creation and content seeding'
    },
    { 
      id: 'guest-posting', 
      name: 'Guest Posting', 
      icon: Mail, 
      status: 'active',
      taskCount: 31,
      successRate: 85.3,
      description: 'Automated guest post outreach and submissions'
    }
  ];

  const recentActivities = [
    { id: 1, engine: 'Blog Commenting', action: 'Comment posted successfully', target: 'techblog.example.com', status: 'success', time: '2 minutes ago' },
    { id: 2, engine: 'Social Media', action: 'Tweet published successfully', target: 'Twitter', status: 'success', time: '5 minutes ago' },
    { id: 3, engine: 'Guest Posting', action: 'Outreach email sent', target: 'marketingblog.net', status: 'pending', time: '8 minutes ago' },
    { id: 4, engine: 'Blog Posting', action: 'Article published successfully', target: 'myblog.wordpress.com', status: 'success', time: '12 minutes ago' },
    { id: 5, engine: 'Forum Profiles', action: 'Profile created successfully', target: 'marketingforum.com', status: 'success', time: '15 minutes ago' },
  ];

  useEffect(() => {
    // Mock real-time updates
    const interval = setInterval(() => {
      setSystemMetrics(prev => ({
        ...prev,
        uptime: prev.uptime + 1,
        actionsPerHour: Math.floor(Math.random() * 10) + 20
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'idle': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavigationHeader />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Migration Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    🚀 New Automation System Available!
                  </h3>
                  <p className="text-blue-700">
                    We've rebuilt the automation system with improved campaign management, 
                    better tracking, and enhanced user experience.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/automation')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try New System
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="h-8 w-8 text-blue-600" />
                Automation System (Legacy)
              </h1>
              <p className="text-gray-600 mt-1">Enterprise-grade backlinking automation platform with advanced safety controls</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={systemStatus === 'running' ? 'default' : 'secondary'} className="px-3 py-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${systemStatus === 'running' ? 'bg-green-400' : 'bg-gray-400'}`} />
                System {systemStatus === 'running' ? 'Running' : 'Stopped'}
              </Badge>
              <Button
                onClick={() => setSystemStatus(systemStatus === 'running' ? 'stopped' : 'running')}
                variant={systemStatus === 'running' ? 'destructive' : 'default'}
                className="flex items-center gap-2"
              >
                {systemStatus === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {systemStatus === 'running' ? 'Stop System' : 'Start System'}
              </Button>
            </div>
          </div>

          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  +2 from last week
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">286</div>
                <p className="text-xs text-muted-foreground">
                  +45 tasks queued
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions/Hour</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.actionsPerHour}</div>
                <p className="text-xs text-muted-foreground">
                  Within safety limits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard */}
          <div className="space-y-6">
            {/* Engine Status Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Engine Status Overview</CardTitle>
                <CardDescription>Current status and performance of all automation engines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {engines.map((engine) => {
                    const IconComponent = engine.icon;
                    return (
                      <div key={engine.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                            <h3 className="text-sm font-medium">{engine.name}</h3>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(engine.status)}`} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">{engine.description}</p>
                          <div className="flex justify-between text-sm">
                            <span>Tasks: {engine.taskCount}</span>
                            <span className="text-green-600">{engine.successRate}%</span>
                          </div>
                          <Progress value={engine.successRate} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest automation activities across all engines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(activity.status)}
                        <div>
                          <p className="font-medium text-sm">{activity.engine}</p>
                          <p className="text-xs text-gray-600 tracking-wide">{activity.action} on {activity.target}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.status === 'success' ? 'default' : 'secondary'} className="text-xs">
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          {systemStatus === 'stopped' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The automation system is currently stopped. Click "Start System" to begin processing campaigns.
              </AlertDescription>
            </Alert>
          )}

          {/* Deprecation Notice */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <strong>Notice:</strong> This legacy automation system will be deprecated soon. 
              Please migrate to the new system at <button 
                onClick={() => navigate('/automation')}
                className="underline hover:no-underline font-medium"
              >
                /automation
              </button> for the latest features and improved performance.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
