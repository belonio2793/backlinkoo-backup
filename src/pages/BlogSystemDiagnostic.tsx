import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogSystemDiagnostic as BlogDiagnosticUtility, type DiagnosticResult } from '@/utils/blogSystemDiagnostic';
import { DatabaseSetup } from '@/utils/databaseSetup';
import { NetworkTester } from '@/components/NetworkTester';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Database, 
  FileText,
  Settings,
  ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BlogSystemDiagnostic() {
  const navigate = useNavigate();
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [summary, setSummary] = useState({ success: 0, warning: 0, error: 0, total: 0 });

  const runDiagnostic = async () => {
    setIsRunning(true);
    try {
      const diagnostic = new BlogDiagnosticUtility();
      const results = await diagnostic.runFullDiagnostic();
      setDiagnosticResults(results);
      setSummary(diagnostic.getSummary());
    } catch (error) {
      console.error('Failed to run diagnostic:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    try {
      console.log('🔄 Initializing database...');
      
      // Test connection
      const isConnected = await DatabaseSetup.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // Create sample posts if needed
      await DatabaseSetup.createSamplePosts();
      
      console.log('✅ Database initialization complete');
      
      // Re-run diagnostic
      await runDiagnostic();
    } catch (error) {
      console.error('Database initialization failed:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  const criticalErrors = diagnosticResults.filter(r => r.status === 'error');
  const hasCriticalErrors = criticalErrors.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Blog System Diagnostic
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of the blog system health and functionality
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-semibold text-green-600">{summary.success}</div>
                  <div className="text-sm text-gray-600">Passing</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-semibold text-yellow-600">{summary.warning}</div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-600">{summary.error}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-600">{summary.total}</div>
                  <div className="text-sm text-gray-600">Total Checks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={runDiagnostic}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Diagnostic'}
          </Button>
          
          <Button
            onClick={initializeDatabase}
            disabled={isInitializing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className={`h-4 w-4 ${isInitializing ? 'animate-spin' : ''}`} />
            {isInitializing ? 'Initializing...' : 'Initialize Database'}
          </Button>
        </div>

        {/* Critical Issues Alert */}
        {hasCriticalErrors && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Critical Issues Detected:</strong> The blog system has {criticalErrors.length} critical error(s) that need immediate attention.
              <div className="mt-2">
                {criticalErrors.map((error, index) => (
                  <div key={index} className="text-sm">
                    • {error.component}: {error.message}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic Results */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Results ({summary.total})</TabsTrigger>
            <TabsTrigger value="errors">Errors ({summary.error})</TabsTrigger>
            <TabsTrigger value="warnings">Warnings ({summary.warning})</TabsTrigger>
            <TabsTrigger value="success">Success ({summary.success})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {diagnosticResults.map((result, index) => (
              <Card key={index} className={`border-l-4 ${getStatusColor(result.status)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <CardTitle className="text-lg">{result.component}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                      </div>
                    </div>
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status}
                    </Badge>
                  </div>
                </CardHeader>
                {(result.details || result.error) && (
                  <CardContent className="pt-0">
                    {result.details && (
                      <div className="mb-2">
                        <h4 className="font-medium text-sm mb-2">Details:</h4>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                    {result.error && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-red-700">Error:</h4>
                        <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto text-red-800">
                          {JSON.stringify(result.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="errors" className="space-y-4">
            {diagnosticResults
              .filter(r => r.status === 'error')
              .map((result, index) => (
                <Card key={index} className="border-l-4 border-red-500 bg-red-50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <CardTitle className="text-lg text-red-800">{result.component}</CardTitle>
                        <p className="text-sm text-red-600 mt-1">{result.message}</p>
                      </div>
                    </div>
                  </CardHeader>
                  {result.error && (
                    <CardContent>
                      <pre className="text-xs bg-red-100 p-2 rounded overflow-x-auto text-red-800">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </CardContent>
                  )}
                </Card>
              ))}
          </TabsContent>
          
          <TabsContent value="warnings" className="space-y-4">
            {diagnosticResults
              .filter(r => r.status === 'warning')
              .map((result, index) => (
                <Card key={index} className="border-l-4 border-yellow-500 bg-yellow-50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <CardTitle className="text-lg text-yellow-800">{result.component}</CardTitle>
                        <p className="text-sm text-yellow-600 mt-1">{result.message}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </TabsContent>
          
          <TabsContent value="success" className="space-y-4">
            {diagnosticResults
              .filter(r => r.status === 'success')
              .map((result, index) => (
                <Card key={index} className="border-l-4 border-green-500 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <CardTitle className="text-lg text-green-800">{result.component}</CardTitle>
                        <p className="text-sm text-green-600 mt-1">{result.message}</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Diagnostic ran on {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
