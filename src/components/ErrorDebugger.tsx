import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Copy,
  Database,
  Key
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function ErrorDebugger() {
  const { toast } = useToast();
  const [errors, setErrors] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [envVars, setEnvVars] = useState<any>({});

  useEffect(() => {
    checkSystemHealth();
    loadEnvironmentInfo();
  }, []);

  const loadEnvironmentInfo = () => {
    const env = {
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasOpenAIKey: !!import.meta.env.OPENAI_API_KEY,
      supabaseUrlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
      supabaseKeyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      openaiKeyLength: import.meta.env.OPENAI_API_KEY?.length || 0,
      supabaseUrlPreview: import.meta.env.VITE_SUPABASE_URL ? 
        `${import.meta.env.VITE_SUPABASE_URL.substring(0, 30)}...` : 'Not set',
      supabaseKeyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
        `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'Not set',
      openaiKeyPreview: import.meta.env.OPENAI_API_KEY ?
        `${import.meta.env.OPENAI_API_KEY.substring(0, 20)}...` : 'Not set'
    };
    setEnvVars(env);
  };

  const checkSystemHealth = async () => {
    setIsChecking(true);
    const detectedErrors: any[] = [];

    try {
      // Test 1: Environment Variables
      if (!import.meta.env.VITE_SUPABASE_URL) {
        detectedErrors.push({
          type: 'environment',
          severity: 'high',
          message: 'VITE_SUPABASE_URL environment variable is missing',
          details: 'This is required for database connectivity',
          solution: 'Set VITE_SUPABASE_URL in your environment variables'
        });
      }

      if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
        detectedErrors.push({
          type: 'environment',
          severity: 'high',
          message: 'VITE_SUPABASE_ANON_KEY environment variable is missing',
          details: 'This is required for database authentication',
          solution: 'Set VITE_SUPABASE_ANON_KEY in your environment variables'
        });
      }

      // Test 2: Database Connection
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        
        if (error) {
          const errorDetails = {
            message: error.message || 'Unknown database error',
            details: error.details || 'No additional details',
            hint: error.hint || 'No hint provided',
            code: error.code || 'No error code'
          };

          detectedErrors.push({
            type: 'database',
            severity: 'high',
            message: `Database connection failed: ${errorDetails.message}`,
            details: JSON.stringify(errorDetails, null, 2),
            solution: 'Check Supabase configuration and ensure the database is accessible',
            rawError: error
          });
        }
      } catch (dbError: any) {
        detectedErrors.push({
          type: 'database',
          severity: 'critical',
          message: `Database connection threw exception: ${dbError.message || 'Unknown error'}`,
          details: JSON.stringify(dbError, null, 2),
          solution: 'Check network connectivity and Supabase service status',
          rawError: dbError
        });
      }

      // Test 3: Admin Environment Variables Table
      try {
        const { data, error } = await supabase
          .from('admin_environment_variables')
          .select('*')
          .limit(1);

        if (error) {
          const errorDetails = {
            message: error.message || 'Unknown error',
            details: error.details || 'No additional details',
            hint: error.hint || 'No hint provided',
            code: error.code || 'No error code'
          };

          detectedErrors.push({
            type: 'database_table',
            severity: 'medium',
            message: `Admin environment variables table error: ${errorDetails.message}`,
            details: JSON.stringify(errorDetails, null, 2),
            solution: 'Check if admin_environment_variables table exists in Supabase',
            rawError: error
          });
        }
      } catch (tableError: any) {
        detectedErrors.push({
          type: 'database_table',
          severity: 'medium',
          message: `Admin table access threw exception: ${tableError.message || 'Unknown error'}`,
          details: JSON.stringify(tableError, null, 2),
          solution: 'Check table permissions and schema',
          rawError: tableError
        });
      }

      setErrors(detectedErrors);

    } catch (systemError: any) {
      detectedErrors.push({
        type: 'system',
        severity: 'critical',
        message: `System health check failed: ${systemError.message || 'Unknown error'}`,
        details: JSON.stringify(systemError, null, 2),
        solution: 'Check console for more details',
        rawError: systemError
      });
      setErrors(detectedErrors);
    } finally {
      setIsChecking(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Error details copied to clipboard",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          System Error Debugger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="errors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="errors">Error Analysis</TabsTrigger>
            <TabsTrigger value="environment">Environment Info</TabsTrigger>
          </TabsList>

          <TabsContent value="errors" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Detected Issues ({errors.length})
              </h3>
              <Button 
                onClick={checkSystemHealth} 
                disabled={isChecking}
                size="sm"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-scan
                  </>
                )}
              </Button>
            </div>

            {errors.length === 0 && !isChecking && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  No errors detected! System appears to be healthy.
                </AlertDescription>
              </Alert>
            )}

            {errors.map((error, index) => (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                      <Badge variant="outline">{error.type}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(error, null, 2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-red-800">{error.message}</h4>
                    <p className="text-sm text-gray-600 mt-1">{error.details}</p>
                  </div>
                  
                  <Alert>
                    <AlertDescription>
                      <strong>Solution:</strong> {error.solution}
                    </AlertDescription>
                  </Alert>

                  {error.rawError && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">Raw Error Object</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(error.rawError, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="environment" className="space-y-4">
            <h3 className="text-lg font-semibold">Environment Variables Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Supabase Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>URL:</span>
                    <Badge variant={envVars.hasSupabaseUrl ? "default" : "destructive"}>
                      {envVars.hasSupabaseUrl ? "Set" : "Missing"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Anon Key:</span>
                    <Badge variant={envVars.hasSupabaseKey ? "default" : "destructive"}>
                      {envVars.hasSupabaseKey ? "Set" : "Missing"}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>URL: {envVars.supabaseUrlPreview}</div>
                    <div>Key: {envVars.supabaseKeyPreview}</div>
                  </div>
                </CardContent>
              </Card>


            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
