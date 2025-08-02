import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  Settings,
  Users,
  Shield,
  Code,
  Wrench,
  Info
} from 'lucide-react';
import { ConfigurationAudit, quickConfigurationCheck } from '@/utils/configurationAudit';
import type { ConfigurationAuditResult, ConfigurationIssue } from '@/utils/configurationAudit';

export function ConfigurationDiagnostic() {
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<ConfigurationAuditResult | null>(null);
  const [quickCheckResult, setQuickCheckResult] = useState<{ hasIssues: boolean; summary: string } | null>(null);
  const { toast } = useToast();

  // Run quick check on component mount
  useEffect(() => {
    runQuickCheck();
  }, []);

  const runQuickCheck = async () => {
    try {
      const result = await quickConfigurationCheck();
      setQuickCheckResult(result);
    } catch (error: any) {
      console.error('Quick check failed:', error);
    }
  };

  const runFullAudit = async () => {
    try {
      setIsRunningAudit(true);
      setAuditResult(null);

      console.log('🔍 Running comprehensive configuration audit...');

      const result = await ConfigurationAudit.performAudit();
      setAuditResult(result);

      const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
      const warningCount = result.issues.filter(i => i.severity === 'warning').length;

      if (criticalCount === 0 && warningCount === 0) {
        toast({
          title: "Configuration Audit Passed",
          description: "No issues found in your configuration",
        });
      } else if (criticalCount > 0) {
        toast({
          title: "Critical Issues Found",
          description: `Found ${criticalCount} critical and ${warningCount} warning issues`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Minor Issues Found",
          description: `Found ${warningCount} warning issues - review recommended`,
          variant: "default"
        });
      }

    } catch (error: any) {
      console.error('Configuration audit failed:', error);
      toast({
        title: "Audit Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunningAudit(false);
    }
  };

  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Warning</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'environment':
        return <Settings className="h-4 w-4" />;
      case 'rls':
        return <Shield className="h-4 w-4" />;
      case 'functions':
        return <Code className="h-4 w-4" />;
      case 'types':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const groupIssuesByCategory = (issues: ConfigurationIssue[]) => {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = [];
      }
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, ConfigurationIssue[]>);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Diagnostic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Comprehensive analysis of your Supabase configuration, database schema, and potential issues.
          </div>

          {/* Quick Status */}
          {quickCheckResult && (
            <Alert className={quickCheckResult.hasIssues ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
              {quickCheckResult.hasIssues ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={quickCheckResult.hasIssues ? "text-orange-700" : "text-green-700"}>
                <strong>Quick Check:</strong> {quickCheckResult.summary}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={runFullAudit}
              disabled={isRunningAudit}
              className="gap-2"
            >
              {isRunningAudit ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isRunningAudit ? 'Running Audit...' : 'Run Full Audit'}
            </Button>
            
            <Button
              onClick={runQuickCheck}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>

          {/* Audit Results */}
          {auditResult && (
            <Tabs defaultValue="issues" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="issues">
                  Issues ({auditResult.issues.length})
                </TabsTrigger>
                <TabsTrigger value="schema">
                  Schema Info
                </TabsTrigger>
                <TabsTrigger value="recommendations">
                  Recommendations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="issues" className="space-y-4">
                {auditResult.issues.length === 0 ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      🎉 No configuration issues found! Your setup looks good.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupIssuesByCategory(auditResult.issues)).map(([category, issues]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2 capitalize">
                          {getCategoryIcon(category)}
                          {category} Issues
                        </h4>
                        
                        {issues.map((issue, index) => (
                          <div key={index} className="p-4 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(issue.severity)}
                                <span className="font-medium">{issue.description}</span>
                              </div>
                              {getSeverityBadge(issue.severity)}
                            </div>
                            
                            {issue.solution && (
                              <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                                <strong>Solution:</strong> {issue.solution}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="schema" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Table Accessibility</h4>
                    <div className="space-y-2">
                      {Object.entries(auditResult.schemaInfo.tablesAccessible).map(([table, accessible]) => (
                        <div key={table} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span>{table}</span>
                          {accessible ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accessible
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Accessible
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Role System</h4>
                    <div className="p-3 bg-muted/30 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">Type:</span>
                        <Badge variant="outline">{auditResult.schemaInfo.roleSystemType}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {auditResult.schemaInfo.roleSystemType === 'profiles_role' && 
                          'Using profiles.role column for user roles (recommended)'}
                        {auditResult.schemaInfo.roleSystemType === 'user_roles_table' && 
                          'Using separate user_roles table for user roles'}
                        {auditResult.schemaInfo.roleSystemType === 'mixed' && 
                          'Both profiles.role and user_roles table found (may cause conflicts)'}
                        {auditResult.schemaInfo.roleSystemType === 'unknown' && 
                          'No role system detected (critical issue)'}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {auditResult.recommendations.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No specific recommendations at this time.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    {auditResult.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-blue-800">{rec}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Quick Fixes Section */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Common Issues & Quick Fixes
            </h4>
            <div className="text-sm text-gray-700 space-y-2">
              <div>• <strong>User signup fails:</strong> Check handle_new_user trigger function and user_roles table</div>
              <div>• <strong>Role system conflicts:</strong> Choose either profiles.role OR user_roles table</div>
              <div>• <strong>Database errors:</strong> Verify RLS policies and table permissions</div>
              <div>• <strong>Admin functions fail:</strong> Ensure SUPABASE_SERVICE_ROLE_KEY is configured</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
