import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  RefreshCw, 
  Pause, 
  Play, 
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Filter
} from 'lucide-react';

export function QueueMonitor() {
  const [selectedQueue, setSelectedQueue] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const queues = [
    {
      id: 'blog-commenting',
      name: 'Blog Commenting',
      pending: 45,
      processing: 8,
      completed: 126,
      failed: 12,
      avgProcessingTime: 42,
      successRate: 91.3
    },
    {
      id: 'blog-posting',
      name: 'Blog Posting',
      pending: 12,
      processing: 3,
      completed: 45,
      failed: 2,
      avgProcessingTime: 128,
      successRate: 95.7
    },
    {
      id: 'forum-profiles',
      name: 'Forum Profiles',
      pending: 6,
      processing: 1,
      completed: 23,
      failed: 3,
      avgProcessingTime: 156,
      successRate: 88.5
    },
    {
      id: 'social-media',
      name: 'Social Media',
      pending: 28,
      processing: 5,
      completed: 78,
      failed: 8,
      avgProcessingTime: 35,
      successRate: 90.7
    },
    {
      id: 'web2',
      name: 'Web 2.0',
      pending: 18,
      processing: 2,
      completed: 34,
      failed: 5,
      avgProcessingTime: 245,
      successRate: 87.2
    },
    {
      id: 'guest-posting',
      name: 'Guest Posting',
      pending: 15,
      processing: 4,
      completed: 29,
      failed: 6,
      avgProcessingTime: 89,
      successRate: 82.9
    }
  ];

  const recentTasks = [
    {
      id: 'task_001',
      queue: 'blog-commenting',
      status: 'completed',
      target: 'techblog.example.com',
      startTime: '14:32:15',
      duration: '38s',
      priority: 5
    },
    {
      id: 'task_002',
      queue: 'social-media',
      status: 'processing',
      target: 'Twitter',
      startTime: '14:33:22',
      duration: '12s',
      priority: 3
    },
    {
      id: 'task_003',
      queue: 'guest-posting',
      status: 'failed',
      target: 'marketingblog.net',
      startTime: '14:30:45',
      duration: '2m 15s',
      priority: 1,
      error: 'Connection timeout occurred'
    },
    {
      id: 'task_004',
      queue: 'blog-posting',
      status: 'pending',
      target: 'myblog.wordpress.com',
      startTime: '-',
      duration: '-',
      priority: 2
    },
    {
      id: 'task_005',
      queue: 'forum-profiles',
      status: 'completed',
      target: 'forums.example.com',
      startTime: '14:28:33',
      duration: '1m 45s',
      priority: 4
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'bg-red-500';
    if (priority <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const filteredQueues = selectedQueue === 'all' ? queues : queues.filter(q => q.id === selectedQueue);
  const totalStats = queues.reduce((acc, queue) => ({
    pending: acc.pending + queue.pending,
    processing: acc.processing + queue.processing,
    completed: acc.completed + queue.completed,
    failed: acc.failed + queue.failed
  }), { pending: 0, processing: 0, completed: 0, failed: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      console.log('Refreshing queue data...');
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Queue Monitor</h2>
          <p className="text-gray-600">Real-time task queue monitoring and management</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedQueue} onValueChange={setSelectedQueue}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by queue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Queues</SelectItem>
              {queues.map(queue => (
                <SelectItem key={queue.id} value={queue.id}>
                  {queue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStats.processing}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalStats.failed}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Details */}
      <div className="grid gap-6">
        {filteredQueues.map((queue) => (
          <Card key={queue.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{queue.name}</CardTitle>
                  <CardDescription>
                    Success Rate: {queue.successRate}% | Avg Processing: {queue.avgProcessingTime}s
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Queue Stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-yellow-600">{queue.pending}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-blue-600">{queue.processing}</p>
                    <p className="text-xs text-gray-600">Processing</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-green-600">{queue.completed}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-red-600">{queue.failed}</p>
                    <p className="text-xs text-gray-600">Failed</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Queue Progress</span>
                    <span>{queue.successRate}%</span>
                  </div>
                  <Progress value={queue.successRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Task Activity
          </CardTitle>
          <CardDescription>Latest task executions across all queues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{task.id}</p>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                    </div>
                    <p className="text-xs text-gray-600">{task.queue} • {task.target}</p>
                    {task.error && (
                      <p className="text-xs text-red-600">{task.error}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                    {task.status}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    <p>Start: {task.startTime}</p>
                    <p>Duration: {task.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
