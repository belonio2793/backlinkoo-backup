import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Zap, RefreshCw } from 'lucide-react';

interface ApiEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST';
  testData?: any;
  critical: boolean;
}

interface ApiResult {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'testing';
  responseTime: number;
  statusCode?: number;
  error?: string;
  lastChecked: Date;
}

export const ApiHealthChecker: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ApiResult[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const endpoints: ApiEndpoint[] = [
    {
      name: 'API Status',
      url: '/.netlify/functions/api-status',
      method: 'GET',
      critical: true
    },
    {
      name: 'Working Content Generator',
      url: '/.netlify/functions/working-content-generator',
      method: 'POST',
      testData: {
        keyword: 'test',
        anchor_text: 'test link',
        target_url: 'https://example.com',
        word_count: 500
      },
      critical: true
    },
    {
      name: 'AI Content Generator',
      url: '/.netlify/functions/ai-content-generator',
      method: 'POST',
      testData: {
        keyword: 'test',
        anchor_text: 'test link',
        target_url: 'https://example.com'
      },
      critical: false
    },
    {
      name: 'Telegraph Publisher',
      url: '/.netlify/functions/telegraph-publisher',
      method: 'POST',
      testData: {
        title: 'API Health Check Test',
        content: 'This is a test content for API health verification.',
        author_name: 'Health Checker'
      },
      critical: true
    }
  ];

  const testEndpoint = async (endpoint: ApiEndpoint): Promise<ApiResult> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint.testData ? JSON.stringify(endpoint.testData) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (response.status >= 500) {
        status = 'unhealthy';
      } else if (response.status >= 400 || responseTime > 3000) {
        status = 'degraded';
      }

      // For our content generators, 405 Method Not Allowed for OPTIONS is actually healthy
      if (endpoint.method === 'POST' && response.status === 405) {
        status = 'healthy';
      }

      return {
        endpoint: endpoint.name,
        status,
        responseTime,
        statusCode: response.status,
        lastChecked: new Date()
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        endpoint: endpoint.name,
        status: 'unhealthy',
        responseTime,
        error: error.message || 'Network error',
        lastChecked: new Date()
      };
    }
  };

  const runHealthCheck = async () => {
    setTesting(true);
    setResults([]);

    const testResults: ApiResult[] = [];

    for (const endpoint of endpoints) {
      // Update status to testing
      setResults(prev => [...prev.filter(r => r.endpoint !== endpoint.name), {
        endpoint: endpoint.name,
        status: 'testing',
        responseTime: 0,
        lastChecked: new Date()
      }]);

      const result = await testEndpoint(endpoint);
      testResults.push(result);
      
      // Update with real result
      setResults(prev => [...prev.filter(r => r.endpoint !== endpoint.name), result]);
    }

    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'testing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500'; 
      case 'unhealthy': return 'bg-red-500';
      case 'testing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(runHealthCheck, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const totalCount = results.length;
  const overallHealth = totalCount > 0 ? Math.round((healthyCount / totalCount) * 100) : 0;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Platform API Health Monitor
        </CardTitle>
        <CardDescription>
          Monitor the health and response times of all platform APIs
        </CardDescription>
        {results.length > 0 && (
          <div className="flex items-center gap-4 mt-2">
            <Badge variant={overallHealth >= 80 ? "default" : overallHealth >= 60 ? "secondary" : "destructive"}>
              {overallHealth}% Healthy
            </Badge>
            <span className="text-sm text-gray-600">
              {healthyCount}/{totalCount} endpoints healthy
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runHealthCheck}
            disabled={testing}
            className="flex-1"
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing APIs...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Health Check
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-blue-50" : ""}
          >
            {autoRefresh ? "Stop Auto-Refresh" : "Auto-Refresh"}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <span className="font-medium">{result.endpoint}</span>
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {result.statusCode && (
                    <Badge variant="outline">{result.statusCode}</Badge>
                  )}
                  <span className="text-gray-600">
                    {result.responseTime}ms
                  </span>
                  <Badge className={getStatusColor(result.status) + " text-white"}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">API Status Summary:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Healthy: </span>
                <span className="font-medium text-green-600">
                  {results.filter(r => r.status === 'healthy').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Degraded: </span>
                <span className="font-medium text-yellow-600">
                  {results.filter(r => r.status === 'degraded').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Unhealthy: </span>
                <span className="font-medium text-red-600">
                  {results.filter(r => r.status === 'unhealthy').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Avg Response: </span>
                <span className="font-medium">
                  {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length) : 0}ms
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
