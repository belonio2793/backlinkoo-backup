import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, AlertCircle, Mail, Settings, Database, Send } from 'lucide-react';
import { emailTest } from '../services/emailConfigurationTest';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

interface TestResults {
  environment?: TestResult;
  resendAPI?: TestResult;
  supabaseAuth?: TestResult;
  emailDelivery?: TestResult;
}

const EmailConfigurationTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResults>({});
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [overallSuccess, setOverallSuccess] = useState<boolean | null>(null);

  const runTests = async () => {
    setTesting(true);
    setResults({});
    setRecommendations([]);
    setOverallSuccess(null);

    try {
      const { overall, results: testResults, recommendations: testRecommendations } = 
        await emailTest.runComprehensiveTest();
      
      setResults(testResults);
      setRecommendations(testRecommendations);
      setOverallSuccess(overall);
    } catch (error: any) {
      console.error('Test error:', error);
      setResults({
        environment: {
          success: false,
          message: 'Test suite failed to run',
          error: error.message
        }
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    setTesting(true);
    try {
      const result = await emailTest.sendTestConfirmationEmail();
      setResults(prev => ({ ...prev, emailDelivery: result }));
    } catch (error: any) {
      setResults(prev => ({ 
        ...prev, 
        emailDelivery: { 
          success: false, 
          message: 'Failed to send test email', 
          error: error.message 
        } 
      }));
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success?: boolean) => {
    if (success === undefined) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success?: boolean) => {
    if (success === undefined) return <Badge variant="secondary">Not tested</Badge>;
    return success ? 
      <Badge variant="default" className="bg-green-500">Passed</Badge> : 
      <Badge variant="destructive">Failed</Badge>;
  };

  const ResultCard: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    result?: TestResult 
  }> = ({ title, icon, result }) => (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
          {getStatusBadge(result?.success)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(result?.success)}
            <span className="text-sm">{result?.message || 'Not tested'}</span>
          </div>
          
          {result?.error && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">{result.error}</AlertDescription>
            </Alert>
          )}
          
          {result?.details && (
            <div className="bg-muted p-2 rounded text-xs">
              <pre>{JSON.stringify(result.details, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration Tester
          </CardTitle>
          <CardDescription>
            Diagnose and test email configuration for user registration confirmations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={runTests} 
              disabled={testing}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {testing ? 'Running Tests...' : 'Run Full Test Suite'}
            </Button>
            
            <Button 
              onClick={sendTestEmail} 
              disabled={testing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Test Email
            </Button>
          </div>

          {overallSuccess !== null && (
            <Alert variant={overallSuccess ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {overallSuccess 
                  ? '✅ All email configuration tests passed! User registration emails should work.' 
                  : '❌ Some tests failed. User registration emails may not be delivered.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResultCard
          title="Environment Variables"
          icon={<Settings className="h-4 w-4" />}
          result={results.environment}
        />
        
        <ResultCard
          title="Resend API Connection"
          icon={<Mail className="h-4 w-4" />}
          result={results.resendAPI}
        />
        
        <ResultCard
          title="Supabase Auth"
          icon={<Database className="h-4 w-4" />}
          result={results.supabaseAuth}
        />
        
        <ResultCard
          title="Email Delivery"
          icon={<Send className="h-4 w-4" />}
          result={results.emailDelivery}
        />
      </div>

      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Fix Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Supabase Environment Variables:</strong>
            <p className="text-muted-foreground">
              Go to Supabase Dashboard → Project Settings → Environment Variables
              <br />Add: <code>RESEND_API_KEY = re_f2ixyRAw_EA1dtQCo9KnANfJgrgqfXFEq</code>
            </p>
          </div>
          
          <div>
            <strong>2. Supabase Auth Email Templates:</strong>
            <p className="text-muted-foreground">
              Go to Supabase Dashboard → Authentication → Email Templates
              <br />Set redirect URL: <code>https://backlinkoo.com/auth/confirm</code>
            </p>
          </div>
          
          <div>
            <strong>3. Domain Verification:</strong>
            <p className="text-muted-foreground">
              Check Resend Dashboard for domain verification status
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfigurationTester;
