import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Download, 
  RefreshCw, 
  Filter,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Bug,
  Trash2
} from 'lucide-react';

export function SystemLogs() {
  const [logs, setLogs] = useState([
    {
      id: 'log_001',
      timestamp: '2024-01-25 14:35:22',
      level: 'info',
      module: 'BlogCommenting',
      message: 'Comment posted successfully on techblog.example.com',
      data: { taskId: 'task_001', url: 'techblog.example.com/post/123' }
    },
    {
      id: 'log_002',
      timestamp: '2024-01-25 14:35:18',
      level: 'success',
      module: 'SocialMedia',
      message: 'Tweet published successfully',
      data: { platform: 'twitter', tweetId: 'tweet_12345' }
    },
    {
      id: 'log_003',
      timestamp: '2024-01-25 14:35:10',
      level: 'warn',
      module: 'SafetyManager',
      message: 'Rate limit approaching for IP 192.168.1.100',
      data: { ip: '192.168.1.100', currentRate: 45, limit: 50 }
    },
    {
      id: 'log_004',
      timestamp: '2024-01-25 14:34:55',
      level: 'error',
      module: 'GuestPosting',
      message: 'Failed to send outreach email',
      data: { error: 'SMTP connection timeout', target: 'contact@marketingblog.net' }
    },
    {
      id: 'log_005',
      timestamp: '2024-01-25 14:34:45',
      level: 'debug',
      module: 'QueueManager',
      message: 'Processing batch of 5 tasks from blog-commenting queue',
      data: { queueType: 'blog-commenting', batchSize: 5 }
    },
    {
      id: 'log_006',
      timestamp: '2024-01-25 14:34:32',
      level: 'info',
      module: 'ConfigManager',
      message: 'Configuration reloaded successfully',
      data: { configVersion: '1.2.3' }
    },
    {
      id: 'log_007',
      timestamp: '2024-01-25 14:34:28',
      level: 'success',
      module: 'ForumProfile',
      message: 'Profile created successfully on forums.example.com',
      data: { profileId: 'prof_789', username: 'user_12345' }
    },
    {
      id: 'log_008',
      timestamp: '2024-01-25 14:34:15',
      level: 'error',
      module: 'BlogPosting',
      message: 'Authentication failed for WordPress site',
      data: { site: 'myblog.wordpress.com', error: 'Invalid credentials' }
    }
  ]);

  const [filteredLogs, setFilteredLogs] = useState(logs);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const logLevels = ['all', 'debug', 'info', 'success', 'warn', 'error'];
  const modules = ['all', ...Array.from(new Set(logs.map(log => log.module)))];

  useEffect(() => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    // Filter by module
    if (moduleFilter !== 'all') {
      filtered = filtered.filter(log => log.module === moduleFilter);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, levelFilter, moduleFilter, logs]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'debug': return <Bug className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogBadgeVariant = (level: string) => {
    switch (level) {
      case 'success': return 'default';
      case 'info': return 'secondary';
      case 'warn': return 'outline';
      case 'error': return 'destructive';
      case 'debug': return 'outline';
      default: return 'secondary';
    }
  };

  const exportLogs = () => {
    const logData = filteredLogs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      module: log.module,
      message: log.message,
      data: JSON.stringify(log.data)
    }));

    const csv = [
      ['Timestamp', 'Level', 'Module', 'Message', 'Data'].join(','),
      ...logData.map(row => Object.values(row).map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
          <p className="text-gray-600">Monitor system activities and troubleshoot issues</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportLogs} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={clearLogs} className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Log Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Module</label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(module => (
                    <SelectItem key={module} value={module}>
                      {module === 'all' ? 'All Modules' : module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {logLevels.slice(1).map(level => {
          const count = logs.filter(log => log.level === level).length;
          return (
            <Card key={level}>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {getLogIcon(level)}
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-sm text-gray-600 capitalize">{level}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getLogIcon(log.level)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getLogBadgeVariant(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.module}
                      </Badge>
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                    </div>
                    <p className="text-sm font-medium">{log.message}</p>
                    {log.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">
                          Show details
                        </summary>
                        <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Info className="h-8 w-8 mx-auto mb-2" />
                <p>No log entries match your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
