import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ResendEmailService } from '@/services/resendEmailService';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Info,
  Settings,
  Database,
  ExternalLink
} from 'lucide-react';

export const EmailSystemDiagnosis = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (test: string, status: 'success' | 'error' | 'warning', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details, timestamp: new Date().toISOString() }]);
  };

  const runComprehensiveDiagnosis = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      // Test 1: Check Supabase Auth Configuration
      addResult('Supabase Auth Config', 'info', 'Checking Supabase configuration...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        addResult('Supabase Connection', 'success', 'Connected to Supabase successfully');
      } catch (error: any) {
        addResult('Supabase Connection', 'error', `Supabase connection failed: ${error.message}`);
      }

      // Test 2: Test Supabase Built-in Email (Signup simulation)
      addResult('Supabase Email Test', 'info', 'Testing Supabase built-in email system...');
      
      try {
        // This will attempt to send a signup email via Supabase
        const { error } = await supabase.auth.signUp({
          email: testEmail,
          password: 'temp_password_123!',
          options: {
            emailRedirectTo: `https://backlinkoo.com/auth/confirm`,
            data: {
              test_signup: true,
              first_name: 'Test User'
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already exists')) {
            addResult('Supabase Email Test', 'warning', 'User already exists - Supabase email system is working');
          } else {
            addResult('Supabase Email Test', 'error', `Supabase signup error: ${error.message}`, error);
          }
        } else {
          addResult('Supabase Email Test', 'success', 'Supabase email sent successfully (new user created)');
        }
      } catch (error: any) {
        addResult('Supabase Email Test', 'error', `Supabase email test failed: ${error.message}`, error);
      }

      // Test 3: Test Netlify Function
      addResult('Netlify Function Test', 'info', 'Testing Netlify email function...');
      
      try {
        const response = await fetch('/.netlify/functions/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: testEmail,
            subject: 'Email System Diagnosis Test',
            message: `This is a diagnostic test email sent at ${new Date().toISOString()}`,
            from: 'Email System Test <support@backlinkoo.com>'
          })
        });

        const result = await response.json();
        
        if (result.success) {
          addResult('Netlify Function Test', 'success', `Netlify function working - Email ID: ${result.emailId}`, result);
        } else {
          addResult('Netlify Function Test', 'error', `Netlify function failed: ${result.error}`, result);
        }
      } catch (error: any) {
        addResult('Netlify Function Test', 'error', `Netlify function error: ${error.message}`, error);
      }

      // Test 4: Test ResendEmailService
      addResult('ResendEmailService Test', 'info', 'Testing ResendEmailService...');
      
      try {
        const result = await ResendEmailService.sendConfirmationEmail(testEmail);
        
        if (result.success) {
          addResult('ResendEmailService Test', 'success', `ResendEmailService working - Email ID: ${result.emailId}`, result);
        } else {
          addResult('ResendEmailService Test', 'error', `ResendEmailService failed: ${result.error}`, result);
        }
      } catch (error: any) {
        addResult('ResendEmailService Test', 'error', `ResendEmailService error: ${error.message}`, error);
      }

      // Test 5: Check Environment Variables
      addResult('Environment Check', 'info', 'Checking environment configuration...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        addResult('Environment Check', 'success', 'Supabase environment variables configured');
      } else {
        addResult('Environment Check', 'error', 'Missing Supabase environment variables');
      }

      // Test 6: Test Supabase Resend Function
      addResult('Supabase Resend Test', 'info', 'Testing Supabase resend functionality...');
      
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: testEmail,
          options: {
            emailRedirectTo: `https://backlinkoo.com/auth/confirm`
          }
        });

        if (error) {
          if (error.message.includes('already confirmed') || error.message.includes('not found')) {
            addResult('Supabase Resend Test', 'warning', `Resend test result: ${error.message}`);
          } else {
            addResult('Supabase Resend Test', 'error', `Supabase resend error: ${error.message}`, error);
          }
        } else {
          addResult('Supabase Resend Test', 'success', 'Supabase resend function working');
        }
      } catch (error: any) {
        addResult('Supabase Resend Test', 'error', `Supabase resend test failed: ${error.message}`, error);
      }

    } catch (error: any) {
      addResult('System Error', 'error', `Diagnosis failed: ${error.message}`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Email System Comprehensive Diagnosis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter test email address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          <Button 
            onClick={runComprehensiveDiagnosis} 
            disabled={isLoading || !testEmail.trim()}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Run Comprehensive Email Diagnosis
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Diagnosis Results:</h3>
            
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  result.status === 'success' 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : result.status === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.test}</span>
                      <Badge variant={result.status === 'success' ? 'default' : 'secondary'}>
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                    {result.details && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer">Show Details</summary>
                        <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Email System Architecture:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Supabase Auth:</strong> Built-in email confirmation system</li>
            <li>• <strong>Netlify Function:</strong> Custom email via Resend API</li>
            <li>• <strong>ResendEmailService:</strong> Wrapper around Netlify function</li>
            <li>• <strong>Current Flow:</strong> Signup → Supabase email + Custom Resend email</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
