import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Shield,
  Zap,
  Clock,
  ExternalLink,
  RefreshCw,
  Info,
  TrendingUp,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface DomainStatusProps {
  domain: string;
  domainId?: string;
  autoCheck?: boolean;
  onStatusChange?: (status: any) => void;
}

interface ValidationResult {
  success: boolean;
  domain: string;
  status: {
    overall: 'healthy' | 'warning' | 'error' | 'checking';
    issues: string[];
    warnings: string[];
    successes: string[];
    services_checked: number;
    services_healthy: number;
  };
  validations: {
    netlify?: any;
    dns?: any;
    ssl?: any;
    connectivity?: any;
  };
  deployment: any;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    description: string;
    instructions: string[];
    estimated_time: string;
  }>;
  timing: {
    duration_ms: number;
    completed_at: string;
  };
  metadata: {
    validation_id: string;
    checks_run: string[];
  };
}

const ComprehensiveDomainStatus: React.FC<DomainStatusProps> = ({
  domain,
  domainId,
  autoCheck = false,
  onStatusChange
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<'fast' | 'standard' | 'comprehensive'>('standard');

  useEffect(() => {
    if (autoCheck && domain) {
      runComprehensiveValidation();
    }
  }, [domain, autoCheck]);

  const runComprehensiveValidation = async (priority = selectedPriority) => {
    if (!domain) return;

    setIsValidating(true);
    try {
      toast.info(`🔍 Running comprehensive validation for ${domain}...`);

      const checks = priority === 'fast' ? ['netlify', 'dns'] : 
                   priority === 'standard' ? ['netlify', 'dns', 'ssl'] :
                   ['netlify', 'dns', 'ssl', 'connectivity'];

      const response = await fetch('/.netlify/functions/comprehensive-domain-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domain,
          checks: checks,
          priority: priority,
          includeSuggestions: true
        })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setValidationResult(result);
        setLastChecked(new Date().toISOString());
        
        if (onStatusChange) {
          onStatusChange(result);
        }

        // Show appropriate toast based on status
        if (result.status.overall === 'healthy') {
          toast.success(`✅ ${domain} is fully configured and healthy!`);
        } else if (result.status.overall === 'warning') {
          toast.warning(`⚠️ ${domain} has ${result.status.warnings.length} warnings to address`);
        } else {
          toast.error(`❌ ${domain} has ${result.status.issues.length} critical issues`);
        }
      } else {
        throw new Error(result.error || 'Validation failed');
      }

    } catch (error: any) {
      console.error('Comprehensive validation error:', error);
      toast.error(`Validation failed: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-600">Healthy</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-400 text-yellow-600">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getServiceStatus = (service: any) => {
    if (!service) return 'not_checked';
    return service.success ? 'healthy' : 'error';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'low':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!domain) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No domain selected for validation</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-blue-600" />
              <span>Domain Status: {domain}</span>
              {validationResult && getStatusBadge(validationResult.status.overall)}
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={selectedPriority} 
                onChange={(e) => setSelectedPriority(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="fast">Fast Check</option>
                <option value="standard">Standard</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
              <Button
                onClick={() => runComprehensiveValidation()}
                disabled={isValidating}
                size="sm"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Validate
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
          {lastChecked && (
            <p className="text-sm text-gray-500">
              Last checked: {new Date(lastChecked).toLocaleString()}
              {validationResult && ` (${formatDuration(validationResult.timing.duration_ms)})`}
            </p>
          )}
        </CardHeader>

        {isValidating && (
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span>Running comprehensive validation...</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-gray-600">
                Checking Netlify configuration, DNS records, SSL certificates, and connectivity...
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {validationResult && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overall Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(validationResult.status.overall)}
                  Overall Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {validationResult.status.services_healthy}
                    </div>
                    <div className="text-sm text-green-700">Services Healthy</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {validationResult.status.warnings.length}
                    </div>
                    <div className="text-sm text-yellow-700">Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {validationResult.status.issues.length}
                    </div>
                    <div className="text-sm text-red-700">Critical Issues</div>
                  </div>
                </div>

                {validationResult.status.issues.length > 0 && (
                  <Alert className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical Issues Found:</strong>
                      <ul className="mt-2 space-y-1">
                        {validationResult.status.issues.map((issue, index) => (
                          <li key={index} className="text-sm">• {issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {validationResult.status.warnings.length > 0 && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warnings:</strong>
                      <ul className="mt-2 space-y-1">
                        {validationResult.status.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">• {warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  )}
                </Alert>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            {/* Service Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Netlify Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Netlify Configuration
                    {getStatusBadge(getServiceStatus(validationResult.validations.netlify))}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {validationResult.validations.netlify ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Domain Found:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.netlify.netlify?.domain_found ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Site Name:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.netlify.netlify?.site_info?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">SSL Enabled:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.netlify.netlify?.configuration?.ssl_enabled ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not checked</p>
                  )}
                </CardContent>
              </Card>

              {/* DNS Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    DNS Configuration
                    {getStatusBadge(getServiceStatus(validationResult.validations.dns))}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {validationResult.validations.dns ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">DNS Valid:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.dns.validation?.isValid ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Records Found:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.dns.dnsRecords?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Netlify Target:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.dns.validation?.hasNetlifyTarget ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not checked</p>
                  )}
                </CardContent>
              </Card>

              {/* SSL Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    SSL Certificate
                    {getStatusBadge(getServiceStatus(validationResult.validations.ssl))}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {validationResult.validations.ssl ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">HTTPS Accessible:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.ssl.ssl_info?.https_accessible ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {validationResult.validations.ssl.ssl_info?.response_time_ms && (
                        <div className="flex justify-between">
                          <span className="text-sm">Response Time:</span>
                          <span className="text-sm font-medium">
                            {validationResult.validations.ssl.ssl_info.response_time_ms}ms
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not checked</p>
                  )}
                </CardContent>
              </Card>

              {/* Connectivity Status */}
              {validationResult.validations.connectivity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Connectivity
                      {getStatusBadge(getServiceStatus(validationResult.validations.connectivity))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">HTTP:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.connectivity.connectivity?.http?.accessible ? 'Accessible' : 'Not Accessible'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">HTTPS:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.connectivity.connectivity?.https?.accessible ? 'Accessible' : 'Not Accessible'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Netlify Detected:</span>
                        <span className="text-sm font-medium">
                          {validationResult.validations.connectivity.connectivity?.headers?.netlify_detected ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {validationResult.recommendations.length > 0 ? (
              <div className="space-y-4">
                {validationResult.recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getPriorityIcon(rec.priority)}
                        <span className="capitalize">{rec.priority} Priority</span>
                        <Badge variant={rec.priority === 'critical' ? 'destructive' : 'outline'}>
                          {rec.estimated_time}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium mb-2">{rec.action}</h4>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium mb-2 text-sm">Instructions:</h5>
                        <ol className="text-sm space-y-1">
                          {rec.instructions.map((instruction, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-gray-400">{i + 1}.</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    All Set!
                  </h3>
                  <p className="text-gray-600">
                    No recommendations at this time. Your domain configuration looks good.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Deployment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Production URLs */}
                  <div>
                    <h4 className="font-medium mb-2">Production URLs</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Primary URL:</span>
                        <a 
                          href={`https://${domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          https://{domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {validationResult.deployment?.urls?.netlify_subdomain && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Netlify URL:</span>
                          <a 
                            href={validationResult.deployment.urls.netlify_subdomain}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            Netlify subdomain
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Configuration */}
                  {validationResult.deployment?.configuration && (
                    <div>
                      <h4 className="font-medium mb-2">Site Configuration</h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {Object.entries(validationResult.deployment.configuration).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-sm font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {validationResult.deployment?.next_steps && (
                    <div>
                      <h4 className="font-medium mb-2">Next Steps</h4>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <ul className="text-sm space-y-1">
                          {validationResult.deployment.next_steps.map((step, index) => (
                            <li key={index} className="flex gap-2">
                              <span className="text-blue-600">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ComprehensiveDomainStatus;