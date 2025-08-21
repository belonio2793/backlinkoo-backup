import { useEffect, useState } from 'react';
import { createSampleBlogPosts, testDatabaseConnection } from '@/utils/testBlogData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface BlogDataInitializerProps {
  onDataReady?: () => void;
}

export function BlogDataInitializer({ onDataReady }: BlogDataInitializerProps) {
  const [status, setStatus] = useState<'idle' | 'testing' | 'initializing' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tables, setTables] = useState<string[]>([]);
  const [createdPosts, setCreatedPosts] = useState(0);

  const initializeBlogData = async () => {
    setStatus('testing');
    setMessage('Testing database connection...');

    try {
      // Test database connection
      const connectionTest = await testDatabaseConnection();
      
      if (!connectionTest.success) {
        setStatus('error');
        setMessage(connectionTest.message);
        return;
      }

      setTables(connectionTest.tables);
      setMessage(`Database connected. Available tables: ${connectionTest.tables.join(', ')}`);

      // Initialize sample data
      setStatus('initializing');
      setMessage('Creating sample blog posts...');

      const result = await createSampleBlogPosts();
      
      if (result.success) {
        setStatus('ready');
        setCreatedPosts(result.created);
        setMessage(result.message);
        onDataReady?.();
      } else {
        setStatus('error');
        setMessage(result.message);
      }

    } catch (error: any) {
      setStatus('error');
      const errorMessage = error.message || 'Unknown error';

      // Handle API key missing error gracefully
      if (errorMessage.includes('No API key found')) {
        setMessage('Database connection requires proper configuration. The blog will show sample data instead.');
      } else {
        setMessage(`Initialization failed: ${errorMessage}`);
      }
    }
  };

  // Auto-initialize on component mount
  useEffect(() => {
    initializeBlogData();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'testing':
      case 'initializing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'ready':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'testing':
      case 'initializing':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${getStatusColor()}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          {getStatusIcon()}
          <span>Blog Data Initialization</span>
          {status === 'ready' && (
            <Badge className="bg-green-100 text-green-800 border-green-300">
              Ready
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{message}</p>
        
        {tables.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Available Database Tables:</p>
            <div className="flex flex-wrap gap-2">
              {tables.map(table => (
                <Badge key={table} variant="outline" className="text-xs">
                  {table}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {createdPosts > 0 && (
          <div className="bg-white/50 rounded-lg p-3 border border-green-200">
            <p className="text-sm text-green-700 font-medium">
              ✅ Created {createdPosts} sample blog posts
            </p>
            <p className="text-xs text-green-600 mt-1">
              Your blog is now ready with sample content!
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex gap-2">
            <Button
              onClick={initializeBlogData}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Initialization
            </Button>
          </div>
        )}

        {status === 'ready' && (
          <div className="bg-white/70 rounded-lg p-3 border border-green-200">
            <p className="text-sm text-green-700">
              🎉 Blog initialization complete! Your /blog route should now display sample posts.
            </p>
            <p className="text-xs text-green-600 mt-1">
              The blog is ready to use. You can now browse the sample content.
            </p>
          </div>
        )}

        {status === 'error' && message.includes('requires proper configuration') && (
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-sm text-yellow-700">
              ⚠️ {message}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              The blog will work with local sample data until database is configured.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
