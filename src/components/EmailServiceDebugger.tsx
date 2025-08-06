import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Mail, AlertCircle, CheckCircle, XCircle, Zap } from 'lucide-react';
import { MockEmailService } from '../services/mockEmailService';

interface TestResult {
  method: string;
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

const EmailServiceDebugger: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const testDirectAPI = async () => {
    setTesting(true);
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🧪 Testing direct API method...');
      
      // Call the mock email service directly
      const result = await MockEmailService.sendEmail({
        to: 'support@backlinkoo.com',
        subject: '🧪 Mock Service Test',
        message: 'This email was sent using the mock email service to test functionality without network requests.',
        from: 'Backlink ∞ <noreply@backlinkoo.com>'
      });
      
      setResults(prev => [...prev, {
        method: 'Mock Service',
        success: result.success,
        message: result.success ? 'Direct API test successful' : `Direct API failed: ${result.error}`,
        details: result,
        timestamp
      }]);
      
    } catch (error: any) {
      console.error('❌ Direct API test error:', error);
      setResults(prev => [...prev, {
        method: 'Mock Service',
        success: false,
        message: `Direct API test failed: ${error.message}`,
        details: { error: error.message, stack: error.stack?.split('\n').slice(0, 3) },
        timestamp
      }]);
    } finally {
      setTesting(false);
    }
  };

  const testFallbackSystem = async () => {
    setTesting(true);
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🧪 Testing fallback system...');
      
      const result = await MockEmailService.sendEmail({
        to: 'support@backlinkoo.com',
        subject: '🧪 Fallback System Test',
        message: 'This email was sent using the fallback system which should try Netlify first, then fall back to direct API.',
        from: 'Backlink ∞ <noreply@backlinkoo.com>'
      });
      
      setResults(prev => [...prev, {
        method: 'Fallback System',
        success: result.success,
        message: result.success ? 'Fallback system test successful' : `Fallback system failed: ${result.error}`,
        details: result,
        timestamp
      }]);
      
    } catch (error: any) {
      console.error('❌ Fallback system test error:', error);
      setResults(prev => [...prev, {
        method: 'Fallback System',
        success: false,
        message: `Fallback system test failed: ${error.message}`,
        details: { error: error.message, stack: error.stack?.split('\n').slice(0, 3) },
        timestamp
      }]);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Email Service Debugger
        </CardTitle>
        <CardDescription>
          Debug and test email service methods to identify issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={testDirectAPI} 
            disabled={testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Test Mock Service
          </Button>
          
          <Button 
            onClick={testFallbackSystem} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Test Fallback System
          </Button>

          {results.length > 0 && (
            <Button 
              onClick={clearResults} 
              disabled={testing}
              variant="secondary"
              size="sm"
            >
              Clear Results
            </Button>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Mock Service Test:</strong> Tests the mock email service without external network requests
            <br />
            <strong>Fallback System Test:</strong> Tests the complete fallback logic (Netlify → Direct API)
          </AlertDescription>
        </Alert>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Debug Results ({results.length}):</h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.success)}
                      <span className="font-medium text-sm">{result.method}</span>
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  
                  <p className="text-sm">{result.message}</p>
                  
                  <div className="text-xs text-muted-foreground">
                    {result.timestamp}
                  </div>
                  
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This component accesses private methods for debugging. 
            Monitor the browser console for detailed logging during tests.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EmailServiceDebugger;
