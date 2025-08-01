import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Users, 
  FileText, 
  Shield,
  Activity,
  Settings,
  BarChart3
} from 'lucide-react';
import { SystemsAssessmentTool } from '@/utils/systemsAssessment';
import { BlogSystemTest } from '@/utils/blogSystemTest';
import { SlugDiagnosticRunner } from '@/components/SlugDiagnosticRunner';
import type { SystemAssessment, ComponentStatus } from '@/utils/systemsAssessment';

export function SystemsAssessmentDashboard() {
  const [assessment, setAssessment] = useState<SystemAssessment | null>(null);
  const [blogTest, setBlogTest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    runAssessment();
  }, []);

  const runAssessment = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running systems assessment...');
      
      // Run systems assessment
      const assessmentTool = new SystemsAssessmentTool();
      const assessmentResults = await assessmentTool.runFullAssessment();
      setAssessment(assessmentResults);

      // Run blog system test
      const blogResults = await BlogSystemTest.runComprehensiveBlogTest();
      setBlogTest(blogResults);

      setLastUpdate(new Date());
      
      console.log('✅ Assessment complete!');
    } catch (error) {
      console.error('Assessment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Systems Assessment Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive health check of all blog system components
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={runAssessment} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Assessment
              </>
            )}
          </Button>
        </div>
      </div>

      {assessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Overall System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {getStatusIcon(assessment.overall)}
              <div>
                <div className="font-semibold capitalize">{assessment.overall}</div>
                <div className="text-sm text-muted-foreground">
                  {assessment.components.length} components checked
                </div>
              </div>
              <div className="ml-auto">
                <Badge 
                  variant="outline" 
                  className={getStatusColor(assessment.overall)}
                >
                  {assessment.overall.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="systems" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="systems">System Components</TabsTrigger>
          <TabsTrigger value="blog">Blog System</TabsTrigger>
          <TabsTrigger value="slug-diagnostic">Slug Diagnostic</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="space-y-4">
          {assessment?.components.map((component, index) => (
            <ComponentCard key={index} component={component} />
          ))}
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
          {blogTest && (
            <div className="grid gap-4">
              {Object.entries(blogTest).map(([category, result]: [string, any]) => (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-600">{result.details}</p>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-700 font-medium">Errors:</p>
                        <ul className="text-xs text-red-600 mt-1">
                          {result.errors.map((error: string, i: number) => (
                            <li key={i}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="slug-diagnostic" className="space-y-4">
          <SlugDiagnosticRunner />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {assessment?.recommendations.map((recommendation, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).runBlogSystemTest) {
                  (window as any).runBlogSystemTest();
                }
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Test Blog System
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).runSystemsAssessment) {
                  (window as any).runSystemsAssessment();
                }
              }}
            >
              <Database className="h-4 w-4 mr-2" />
              Test Database
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/blog'}
            >
              <Users className="h-4 w-4 mr-2" />
              View Blog Posts
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/404'}
            >
              <Shield className="h-4 w-4 mr-2" />
              Test 404 Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component card helper
function ComponentCard({ component }: { component: ComponentStatus }) {
  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(component.status)}
            {component.name}
          </div>
          <Badge variant="outline" className={getStatusColor(component.status)}>
            {component.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{component.details}</p>
        {component.errors && component.errors.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
            <ul className="text-sm text-red-600 space-y-1">
              {component.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
