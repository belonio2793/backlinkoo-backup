import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Database, 
  RefreshCw,
  Activity,
  Settings,
  Table,
  Code,
  Shield
} from 'lucide-react';
import { blogSystemDiagnostic, type DatabaseDiagnostic } from '@/utils/blogSystemDiagnostic';

export function BlogSystemHealthDashboard() {
  const [diagnostic, setDiagnostic] = useState<DatabaseDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickStatus, setQuickStatus] = useState<any>(null);

  useEffect(() => {
    runQuickCheck();
  }, []);

  const runQuickCheck = async () => {
    try {
      const status = await blogSystemDiagnostic.getQuickStatus();
      setQuickStatus(status);
    } catch (error) {
      console.error('Quick check failed:', error);
    }
  };

  const runFullDiagnostic = async () => {
    setLoading(true);
    try {
      const result = await blogSystemDiagnostic.runFullDiagnostic();
      setDiagnostic(result);
      await runQuickCheck(); // Refresh quick status too
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'issues':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'issues':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Blog System Health</CardTitle>
                <p className="text-sm text-gray-600">
                  Database tables, configurations, and system status
                </p>
              </div>
            </div>
            <Button 
              onClick={runFullDiagnostic} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Scanning...' : 'Run Full Scan'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Status Cards */}
      {quickStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Blog Posts</p>
                  <p className="text-2xl font-bold">{quickStatus.blogPostsCount}</p>
                </div>
                <Table className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">User Saved Posts</p>
                  <div className="flex items-center gap-2">
                    {quickStatus.userSavedPostsExists ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {quickStatus.userSavedPostsExists ? 'Available' : 'Missing'}
                    </span>
                  </div>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Profiles</p>
                  <div className="flex items-center gap-2">
                    {quickStatus.profilesExists ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {quickStatus.profilesExists ? 'Available' : 'Missing'}
                    </span>
                  </div>
                </div>
                <Settings className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Claim System</p>
                  <div className="flex items-center gap-2">
                    {quickStatus.canClaimPost ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {quickStatus.canClaimPost ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Diagnostic Results */}
      {diagnostic && (
        <div className="space-y-4">
          {/* Overall Status */}
          <Alert className={getStatusColor(diagnostic.overall.status)}>
            <div className="flex items-center gap-2">
              {getStatusIcon(diagnostic.overall.status)}
              <AlertDescription>
                <strong>System Status: {diagnostic.overall.status.toUpperCase()}</strong>
                <br />
                {diagnostic.overall.summary}
              </AlertDescription>
            </div>
          </Alert>

          {/* Tables Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Database Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnostic.tables.map((table, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {table.exists ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{table.name}</p>
                        {table.rowCount !== undefined && (
                          <p className="text-sm text-gray-600">{table.rowCount} records</p>
                        )}
                        {table.columns && (
                          <p className="text-xs text-gray-500">{table.columns.length} columns</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={table.required ? 'default' : 'secondary'}>
                        {table.required ? 'Required' : 'Optional'}
                      </Badge>
                      {table.exists && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Exists
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Functions Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Database Functions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diagnostic.functions.map((func, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {func.exists ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                      <p className="font-medium">{func.name}</p>
                    </div>
                    <Badge variant={func.required ? 'default' : 'secondary'}>
                      {func.required ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {diagnostic.overall.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {diagnostic.overall.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SQL Commands to Fix Issues */}
      {diagnostic && diagnostic.overall.status !== 'healthy' && (
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Fix Missing Tables</CardTitle>
            <p className="text-sm text-gray-600">
              Run these SQL commands in your Supabase SQL Editor to fix missing components:
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!diagnostic.tables.find(t => t.name === 'user_saved_posts')?.exists && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Create user_saved_posts table:</h4>
                  <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`-- Create user_saved_posts table
CREATE TABLE user_saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Add indexes
CREATE INDEX idx_user_saved_posts_user_id ON user_saved_posts(user_id);
CREATE INDEX idx_user_saved_posts_post_id ON user_saved_posts(post_id);

-- Enable RLS
ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own saved posts" ON user_saved_posts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save their own posts" ON user_saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved posts" ON user_saved_posts
  FOR DELETE USING (auth.uid() = user_id);`}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
