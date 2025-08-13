import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  CreditCard,
  Server,
  Key,
  Globe,
  Play,
  Eye,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import PaymentDiagnostics, { type PaymentDiagnosticResult } from '@/utils/paymentDiagnostics';
import PaymentQuickFix from '@/utils/paymentQuickFix';

interface DiagnosticResults {
  environment: PaymentDiagnosticResult[];
  endpoints: PaymentDiagnosticResult[];
  functionality: PaymentDiagnosticResult[];
  summary: {
    total: number;
    success: number;
    errors: number;
    warnings: number;
  };
}

export function PaymentDebugger() {
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [quickResults, setQuickResults] = useState<PaymentDiagnosticResult[]>([]);
  const [healthCheck, setHealthCheck] = useState(PaymentQuickFix.performHealthCheck());

  const diagnostics = new PaymentDiagnostics();

  useEffect(() => {
    runQuickDiagnostic();
  }, []);

  const runQuickDiagnostic = async () => {
    try {
      const quick = await diagnostics.quickDiagnostic();
      setQuickResults(quick);
    } catch (error) {
      console.error('Quick diagnostic failed:', error);
    }
  };

  const runComprehensiveDiagnostic = async () => {
    setIsRunning(true);
    try {
      const comprehensive = await diagnostics.runComprehensiveDiagnostics();
      setResults(comprehensive);
      toast.success('Diagnostic complete');
    } catch (error) {
      console.error('Comprehensive diagnostic failed:', error);
      toast.error('Diagnostic failed');
    } finally {
      setIsRunning(false);
    }
  };

  const testPayment = async () => {
    try {
      const testResult = await diagnostics.testPaymentCreation();
      toast.success('Test payment created: ' + testResult.message);
    } catch (error) {
      toast.error('Test payment failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generateReport = async () => {
    try {
      const report = await PaymentQuickFix.generateDiagnosticReport();
      copyToClipboard(report);
      toast.success('Diagnostic report copied to clipboard');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 text-green-700 border-green-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">💳 Payment System Debugger</h1>
        <p className="text-gray-600">Diagnose and fix Stripe payment issues on backlinkoo.com</p>
      </div>

      {/* Health Check Status */}
      {!healthCheck.isHealthy && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment System Issues:</strong> {healthCheck.summary}
            <ul className="mt-2 space-y-1">
              {healthCheck.issues.slice(0, 3).map((issue, index) => (
                <li key={index} className="text-sm">• {issue.description}</li>
              ))}
            </ul>
            {healthCheck.issues.length > 3 && (
              <p className="text-sm mt-2">...and {healthCheck.issues.length - 3} more issues</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Status */}
      {quickResults.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Quick Check Results:</strong>
            <ul className="mt-2 space-y-1">
              {quickResults.map((result, index) => (
                <li key={index} className="text-sm">• {result.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button onClick={runQuickDiagnostic} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Quick Check
        </Button>
        <Button onClick={runComprehensiveDiagnostic} disabled={isRunning}>
          {isRunning ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Full Diagnostic
        </Button>
        <Button onClick={testPayment} variant="outline">
          <CreditCard className="h-4 w-4 mr-2" />
          Test Payment
        </Button>
      </div>

      {/* Environment Variables Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>Check if required API keys are configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <EnvironmentCheck 
              name="VITE_STRIPE_PUBLISHABLE_KEY" 
              value={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}
              required={true}
            />
            <EnvironmentCheck 
              name="VITE_SUPABASE_URL" 
              value={import.meta.env.VITE_SUPABASE_URL}
              required={true}
            />
            <EnvironmentCheck 
              name="VITE_SUPABASE_ANON_KEY" 
              value={import.meta.env.VITE_SUPABASE_ANON_KEY}
              required={true}
            />
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-2">Backend Variables (Netlify only):</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• STRIPE_SECRET_KEY</li>
              <li>• SUPABASE_SERVICE_ROLE_KEY</li>
              <li>• PAYPAL_CLIENT_ID (optional)</li>
              <li>• PAYPAL_SECRET_KEY (optional)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Results */}
      {results && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{results.summary.total}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.summary.success}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{results.summary.errors}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{results.summary.warnings}</div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DiagnosticSection 
              title="Environment" 
              icon={<Key className="h-5 w-5" />}
              results={results.environment}
            />
            <DiagnosticSection 
              title="Endpoints" 
              icon={<Server className="h-5 w-5" />}
              results={results.endpoints}
            />
            <DiagnosticSection 
              title="Functionality" 
              icon={<Globe className="h-5 w-5" />}
              results={results.functionality}
            />
          </div>
        </>
      )}

      {/* Fix Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Common Fixes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">🔑 Missing Stripe Keys</h4>
            <p className="text-sm text-gray-600 mb-2">
              Add these environment variables in Netlify:
            </p>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono">
              VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...<br/>
              STRIPE_SECRET_KEY=sk_test_...
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">🔗 Endpoint Issues</h4>
            <p className="text-sm text-gray-600 mb-2">
              Check that Netlify functions are deployed:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• /.netlify/functions/create-payment</li>
              <li>• /.netlify/functions/create-subscription</li>
              <li>• /.netlify/functions/payment-webhook</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">🚨 Test Mode vs Production</h4>
            <p className="text-sm text-gray-600">
              Ensure you're using the correct Stripe keys for your environment.
              Test keys start with pk_test_ and sk_test_.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EnvironmentCheck({ name, value, required }: { name: string; value: string | undefined; required: boolean }) {
  const isConfigured = !!value && value.trim() !== '';
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        {isConfigured ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <div>
          <span className="font-medium">{name}</span>
          {required && <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isConfigured ? (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Configured
          </Badge>
        ) : (
          <Badge variant="destructive">
            Missing
          </Badge>
        )}
        {isConfigured && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigator.clipboard.writeText(value!)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function DiagnosticSection({ title, icon, results }: { 
  title: string; 
  icon: React.ReactNode; 
  results: PaymentDiagnosticResult[] 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
            {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
            {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
            {result.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
            <div className="flex-1">
              <h4 className="font-medium text-sm">{result.test}</h4>
              <p className="text-xs text-gray-600">{result.message}</p>
              {result.details && (
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer">View Details</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default PaymentDebugger;
