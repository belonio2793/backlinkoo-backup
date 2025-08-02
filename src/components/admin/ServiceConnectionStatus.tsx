/**
 * Service Connection Status - Admin Dashboard Component
 * Tests connections to Netlify, Supabase, and Resend services instantly
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Database,
  Cloud,
  Brain,
  Mail,
  Key,
  Globe
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/utils/errorFormatter';
import { SecureConfig } from '@/lib/secure-config';
import { safeNetlifyFetch } from '@/utils/netlifyFunctionHelper';

interface ServiceStatus {
  name: string;
  status: 'checking' | 'connected' | 'error' | 'not_configured';
  icon: React.ComponentType<any>;
  message: string;
  details?: Record<string, any>;
  responseTime?: number;
}

export function ServiceConnectionStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'OpenAI API',
      status: 'checking',
      icon: Brain,
      message: 'Testing OpenAI API connection...',
    },
    {
      name: 'Netlify Functions',
      status: 'checking',
      icon: Cloud,
      message: 'Testing Netlify function connectivity...',
    },
    {
      name: 'Supabase Database',
      status: 'checking',
      icon: Database,
      message: 'Testing Supabase connection...',
    },
    {
      name: 'Resend Email',
      status: 'checking',
      icon: Mail,
      message: 'Testing Resend email service...',
    },
  ]);

  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const updateServiceStatus = (serviceName: string, updates: Partial<ServiceStatus>) => {
    setServices(prev => prev.map(service => 
      service.name === serviceName 
        ? { ...service, ...updates }
        : service
    ));
  };

  const checkNetlifyFunctions = async (): Promise<void> => {
    const startTime = Date.now();

    const result = await safeNetlifyFetch('test-connection');
    const responseTime = Date.now() - startTime;

    if (result.success && result.data) {
      updateServiceStatus('Netlify Functions', {
        status: 'connected',
        message: 'Netlify functions operational',
        responseTime,
        details: result.data.environment || { mode: 'production' }
      });
    } else if (result.isLocal) {
      updateServiceStatus('Netlify Functions', {
        status: 'connected',
        message: 'Development mode - functions simulated',
        responseTime,
        details: {
          mode: 'development',
          directApiCalls: true,
          netlifyFunctions: false
        }
      });
    } else {
      updateServiceStatus('Netlify Functions', {
        status: 'error',
        message: result.error || 'Function test failed',
        responseTime
      });
    }
  };

  const checkOpenAI = async (): Promise<void> => {
    const startTime = Date.now();

    try {
      // Use TypeScript OpenAI status function (ChatGPT-style approach)
      const result = await safeNetlifyFetch('openai-status');
      const responseTime = Date.now() - startTime;

      if (result.success && result.data) {
        const { configured, status, message, modelCount, keyPreview } = result.data;

        if (status === 'connected') {
          updateServiceStatus('OpenAI API', {
            status: 'connected',
            message: message || 'OpenAI API connected',
            responseTime,
            details: {
              configured: '✅ Yes',
              modelCount: modelCount || 'Unknown',
              keyPreview: keyPreview || 'Hidden',
              method: 'Direct API Test',
              environment: 'Production'
            }
          });
        } else if (status === 'error') {
          updateServiceStatus('OpenAI API', {
            status: 'error',
            message: message || 'OpenAI API error',
            responseTime,
            details: {
              configured: configured ? '✅ Yes' : '❌ No',
              error: result.data.error || 'API call failed',
              method: 'Direct API Test'
            }
          });
        } else {
          updateServiceStatus('OpenAI API', {
            status: 'not_configured',
            message: message || 'OpenAI API key not configured',
            responseTime,
            details: {
              configured: '❌ No',
              method: 'Direct API Test'
            }
          });
        }
      } else {
        // Fallback to old method if new function fails
        const fallbackResult = await safeNetlifyFetch('api-status');
        const fallbackResponseTime = Date.now() - startTime;

        if (fallbackResult.success && fallbackResult.data?.providers?.OpenAI?.configured) {
          updateServiceStatus('OpenAI API', {
            status: 'connected',
            message: 'OpenAI API configured (via fallback check)',
            responseTime: fallbackResponseTime,
            details: {
              method: 'Fallback Check',
              configured: '✅ Yes'
            }
          });
        } else {
          updateServiceStatus('OpenAI API', {
            status: 'error',
            message: 'Unable to verify OpenAI API status',
            responseTime: fallbackResponseTime,
            details: {
              error: result.error || 'Status function unavailable',
              method: 'Failed Check'
            }
          });
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      updateServiceStatus('OpenAI API', {
        status: 'error',
        message: `OpenAI status check failed: ${error instanceof Error ? error.message : 'Network error'}`,
        responseTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          method: 'Exception'
        }
      });
    }
  };

  const checkSupabase = async (): Promise<void> => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        const errorMessage = getErrorMessage(error);
        updateServiceStatus('Supabase Database', {
          status: 'error',
          message: `Database error: ${errorMessage}`,
          responseTime
        });
      } else {
        updateServiceStatus('Supabase Database', {
          status: 'connected',
          message: 'Database connection successful',
          responseTime,
          details: {
            url: import.meta.env.VITE_SUPABASE_URL || SecureConfig.SUPABASE_URL,
            hasAnonKey: !!(import.meta.env.VITE_SUPABASE_ANON_KEY || SecureConfig.SUPABASE_ANON_KEY)
          }
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      updateServiceStatus('Supabase Database', {
        status: 'error',
        message: `Database connection failed: ${errorMessage}`,
        responseTime: Date.now() - startTime
      });
    }
  };



  const checkResend = async (): Promise<void> => {
    const startTime = Date.now();

    // Check if we can access the configured Resend key (either from SecureConfig or production)
    const resendKey = SecureConfig.RESEND_API_KEY;
    const responseTime = Date.now() - startTime;

    if (resendKey && resendKey.startsWith('re_')) {
      // We have a valid Resend key in SecureConfig (production fallback)
      updateServiceStatus('Resend Email', {
        status: 'connected',
        message: 'Resend API key configured in production',
        responseTime,
        details: {
          keyPresent: true,
          keyPreview: resendKey.substring(0, 6) + '...',
          source: 'production-config',
          environment: 'production'
        }
      });
    } else {
      // Check if we can verify via Netlify functions
      try {
        const result = await safeNetlifyFetch('send-email', {
          method: 'POST',
          body: JSON.stringify({
            test: true,
            to: 'admin@backlinkoo.com',
            subject: 'Test',
            html: 'Test'
          })
        });

        if (result.success) {
          updateServiceStatus('Resend Email', {
            status: 'connected',
            message: 'Resend email service available via Netlify functions',
            responseTime: Date.now() - startTime,
            details: {
              available: true,
              source: 'netlify-functions',
              environment: 'production'
            }
          });
        } else {
          updateServiceStatus('Resend Email', {
            status: 'not_configured',
            message: 'Resend API key not configured in production',
            responseTime: Date.now() - startTime
          });
        }
      } catch (error) {
        updateServiceStatus('Resend Email', {
          status: 'not_configured',
          message: 'Resend API key not configured',
          responseTime: Date.now() - startTime
        });
      }
    }
  };

  const runConnectionTests = async () => {
    try {
      setIsChecking(true);
      setLastChecked(new Date());

      // Reset all services to checking
      setServices(prev => prev.map(service => ({
        ...service,
        status: 'checking' as const,
        message: `Testing ${service.name}...`,
        responseTime: undefined
      })));

      // Run tests in parallel for faster results with individual error handling
      const results = await Promise.allSettled([
        checkOpenAI().catch(err => {
          console.warn('OpenAI check failed:', err);
          updateServiceStatus('OpenAI API', {
            status: 'error',
            message: 'OpenAI API test failed',
            responseTime: 0
          });
        }),
        checkNetlifyFunctions().catch(err => {
          console.warn('Netlify functions check failed:', err);
          updateServiceStatus('Netlify Functions', {
            status: 'error',
            message: 'Function test failed',
            responseTime: 0
          });
        }),
        checkSupabase().catch(err => {
          console.warn('Supabase check failed:', err);
          updateServiceStatus('Supabase Database', {
            status: 'error',
            message: 'Database test failed',
            responseTime: 0
          });
        }),
        checkResend().catch(err => {
          console.warn('Resend check failed:', err);
          updateServiceStatus('Resend Email', {
            status: 'error',
            message: 'Email service test failed',
            responseTime: 0
          });
        })
      ]);

      console.log('Connection tests completed:', results);
    } catch (error) {
      console.error('Critical error in runConnectionTests:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Wrap in try-catch to prevent any unhandled errors from crashing the component
    try {
      runConnectionTests().catch(error => {
        console.error('Failed to run connection tests:', error);
        setIsChecking(false);
      });
    } catch (error) {
      console.error('Critical error initializing connection tests:', error);
      setIsChecking(false);
    }
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'not_configured':
        return <Key className="h-4 w-4 text-orange-500" />;
      case 'checking':
      default:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'not_configured':
        return 'border-orange-200 bg-orange-50';
      case 'checking':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getStatusBadge = (service: ServiceStatus) => {
    switch (service.status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
      case 'not_configured':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Not Configured</Badge>;
      case 'checking':
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Checking...</Badge>;
    }
  };

  const connectedCount = services.filter(s => s.status === 'connected').length;
  const totalCount = services.length;
  const healthPercentage = (connectedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Service Connection Status</h2>
            <p className="text-muted-foreground">
              Real-time status of Netlify, Supabase, and Resend services
            </p>
          </div>
        </div>
        <Button onClick={runConnectionTests} variant="outline" disabled={isChecking}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Testing...' : 'Test All'}
        </Button>
      </div>



      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const IconComponent = service.icon;
          return (
            <Card key={service.name} className={`border-2 ${getStatusColor(service.status)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <IconComponent className="h-5 w-5 shrink-0" />
                    <h3 className="font-semibold truncate">{service.name}</h3>
                  </div>
                  <div className="shrink-0">
                    {getStatusIcon(service.status)}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 break-words overflow-hidden">{service.message}</p>
                
                <div className="flex items-center justify-between">
                  {getStatusBadge(service)}
                  {service.responseTime && (
                    <span className="text-xs text-muted-foreground">
                      {service.responseTime}ms
                    </span>
                  )}
                </div>



                {/* Additional Details */}
                {service.details && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    {Object.entries(service.details).map(([key, value]) => {
                      // Handle availableEnvVars as a dropdown
                      if (key === 'availableEnvVars' && Array.isArray(value)) {
                        return (
                          <div key={key} className="space-y-1">
                            <span className="text-xs font-medium">Available Environment Variables ({value.length}):</span>
                            <Select>
                              <SelectTrigger className="w-full h-8 text-xs">
                                <SelectValue placeholder="Select environment variable..." />
                              </SelectTrigger>
                              <SelectContent>
                                {value.map((envVar) => (
                                  <SelectItem key={envVar} value={envVar} className="text-xs">
                                    {envVar}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }

                      // Handle other details normally
                      return (
                        <div key={key} className="flex justify-between items-start gap-2">
                          <span className="font-medium min-w-0 shrink-0">{key}:</span>
                          <span className={`break-all text-right max-w-[200px] truncate ${typeof value === 'boolean' ? (value ? 'text-green-600' : 'text-red-600') : ''}`} title={String(value)}>
                            {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
