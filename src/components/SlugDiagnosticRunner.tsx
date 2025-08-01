import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { slugCollisionDiagnostic, DiagnosticResult } from '@/utils/slugCollisionDiagnostic';

export const SlugDiagnosticRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    setRecommendations([]);

    try {
      const diagnosticResults = await slugCollisionDiagnostic.runFullDiagnostic();
      setResults(diagnosticResults);
      setRecommendations(slugCollisionDiagnostic.getRecommendations());
    } catch (error) {
      console.error('Diagnostic failed:', error);
      setResults([{
        test: 'diagnostic-runner',
        status: 'fail',
        message: `Diagnostic failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const passedCount = results.filter(r => r.status === 'pass').length;
  const failedCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Slug Collision Diagnostic
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the slug generation system to identify and fix collision issues.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running Diagnostic...' : 'Run Slug Collision Diagnostic'}
            </Button>

            {results.length > 0 && (
              <>
                {/* Summary */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{passedCount}</div>
                      <div className="text-sm text-muted-foreground">Passed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                      <div className="text-sm text-muted-foreground">Warnings</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{results.length}</div>
                      <div className="text-sm text-muted-foreground">Total Tests</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {results.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getStatusIcon(result.status)}</span>
                              <div>
                                <div className="font-medium">{result.test}</div>
                                <div className="text-sm text-muted-foreground">{result.message}</div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(result.status)}>
                              {result.status.toUpperCase()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        💡 Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Status Message */}
                <div className={`p-4 rounded-lg ${failedCount === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {failedCount === 0 ? (
                    <div className="flex items-center gap-2">
                      <span>🎉</span>
                      <span className="font-medium">All critical tests passed! Slug collision system is working properly.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>🚨</span>
                      <span className="font-medium">Some tests failed. Review the results above to identify issues.</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlugDiagnosticRunner;
