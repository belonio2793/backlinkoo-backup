import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Mail, Send, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { safeFetch } from '../utils/fullstoryWorkaround';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

const ResendDirectTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const API_KEY = 're_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq';

  const testDomains = async () => {
    setTesting(true);
    const timestamp = new Date().toISOString();
    
    try {
      console.log('🔧 Testing Resend domains endpoint...');
      
      const response = await safeFetch('https://api.resend.com/domains', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const responseText = await response.text();
      console.log('📡 Resend domains response:', response.status, responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        setResults(prev => [...prev, {
          success: true,
          message: `✅ Resend API domains test successful`,
          details: {
            status: response.status,
            domains: data.data?.length || 0,
            domainList: data.data?.map((d: any) => `${d.name} (${d.status})`).join(', ') || 'None',
            responseSize: responseText.length
          },
          timestamp
        }]);
      } else {
        setResults(prev => [...prev, {
          success: false,
          message: `❌ Resend API domains test failed`,
          details: {
            status: response.status,
            statusText: response.statusText,
            response: responseText,
            apiKey: API_KEY.substring(0, 8) + '...'
          },
          timestamp
        }]);
      }
    } catch (error: any) {
      console.error('❌ Resend domains test error:', error);
      setResults(prev => [...prev, {
        success: false,
        message: `❌ Network error: ${error.message}`,
        details: {
          errorType: error.constructor.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          isFullStoryError: error.stack?.includes('fullstory') || error.stack?.includes('fs.js')
        },
        timestamp
      }]);
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    setTesting(true);
    const timestamp = new Date().toISOString();
    
    try {
      console.log('📧 Sending test email via Resend...');
      
      const emailData = {
        from: 'Backlink ∞ <noreply@backlinkoo.com>',
        to: ['support@backlinkoo.com'],
        subject: '🔧 Direct Resend API Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Direct Resend API Test</h2>
            <p>This email was sent directly through the Resend API to test configuration.</p>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
            <p><strong>API Key:</strong> ${API_KEY.substring(0, 8)}...</p>
          </div>
        `
      };

      const response = await safeFetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      const responseText = await response.text();
      console.log('📧 Resend email response:', response.status, responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        setResults(prev => [...prev, {
          success: true,
          message: `✅ Test email sent successfully`,
          details: {
            emailId: data.id,
            to: 'support@backlinkoo.com',
            status: response.status,
            timestamp: timestamp
          },
          timestamp
        }]);
        alert('✅ Test email sent! Check support@backlinkoo.com inbox.');
      } else {
        setResults(prev => [...prev, {
          success: false,
          message: `❌ Failed to send test email`,
          details: {
            status: response.status,
            statusText: response.statusText,
            response: responseText,
            emailData: emailData
          },
          timestamp
        }]);
      }
    } catch (error: any) {
      console.error('❌ Send email test error:', error);
      setResults(prev => [...prev, {
        success: false,
        message: `❌ Email send error: ${error.message}`,
        details: {
          errorType: error.constructor.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
          isFullStoryError: error.stack?.includes('fullstory') || error.stack?.includes('fs.js')
        },
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
          <Mail className="h-5 w-5" />
          Direct Resend API Test
        </CardTitle>
        <CardDescription>
          Direct testing of Resend API endpoints with detailed error reporting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={testDomains} 
            disabled={testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Test Domains API
          </Button>
          
          <Button 
            onClick={sendTestEmail} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Test Email
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
            <strong>API Key:</strong> {API_KEY.substring(0, 12)}...
            <br />
            <strong>Test Email:</strong> support@backlinkoo.com
          </AlertDescription>
        </Alert>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results ({results.length}):</h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.success)}
                      <span className="font-medium text-sm">{result.message}</span>
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  
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
      </CardContent>
    </Card>
  );
};

export default ResendDirectTest;
