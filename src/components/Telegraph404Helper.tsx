import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { TelegraphErrorFixer, type TelegraphDiagnostic } from '@/utils/telegraphErrorFixer';

interface Telegraph404HelperProps {
  telegraphUrl?: string;
  onClose?: () => void;
}

export function Telegraph404Helper({ telegraphUrl, onClose }: Telegraph404HelperProps) {
  const [diagnostic, setDiagnostic] = useState<TelegraphDiagnostic | null>(null);
  const [loading, setLoading] = useState(false);
  const [telegraphServiceStatus, setTelegraphServiceStatus] = useState<boolean | null>(null);

  const runDiagnostic = async (url: string) => {
    setLoading(true);
    try {
      const [urlDiagnostic, serviceStatus] = await Promise.all([
        TelegraphErrorFixer.diagnoseTelegraphUrl(url),
        TelegraphErrorFixer.checkTelegraphService()
      ]);
      
      setDiagnostic(urlDiagnostic);
      setTelegraphServiceStatus(serviceStatus);
    } catch (error) {
      console.error('Diagnostic failed:', error);
      setDiagnostic({
        url,
        accessible: false,
        status: 0,
        issue: 'Failed to run diagnostic',
        solution: 'Please try again later.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (telegraphUrl) {
      runDiagnostic(telegraphUrl);
    }
  }, [telegraphUrl]);

  const getStatusIcon = (status: number) => {
    if (status === 200) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 404) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (accessible: boolean, status: number) => {
    if (accessible) {
      return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Accessible</Badge>;
    }
    if (status === 404) {
      return <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">404 Not Found</Badge>;
    }
    return <Badge variant="destructive">Error {status}</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>Telegraph 404 Diagnostic</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          )}
        </div>
        <CardDescription>
          Diagnose and resolve Telegraph page accessibility issues
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Telegraph Service</span>
          </div>
          <div className="flex items-center gap-2">
            {telegraphServiceStatus === null ? (
              <Badge variant="outline">Checking...</Badge>
            ) : (
              <Badge variant={telegraphServiceStatus ? "secondary" : "destructive"}>
                {telegraphServiceStatus ? "Online" : "Offline"}
              </Badge>
            )}
          </div>
        </div>

        {/* URL Diagnostic */}
        {telegraphUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Page Diagnostic</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runDiagnostic(telegraphUrl)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Checking...' : 'Recheck'}
              </Button>
            </div>

            {diagnostic && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostic.status)}
                    <span className="font-mono text-sm">{diagnostic.url}</span>
                  </div>
                  {getStatusBadge(diagnostic.accessible, diagnostic.status)}
                </div>

                {diagnostic.issue && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Issue:</strong> {diagnostic.issue}
                    </AlertDescription>
                  </Alert>
                )}

                {diagnostic.solution && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Solution:</strong>
                      <div className="mt-2 whitespace-pre-line text-sm">
                        {diagnostic.solution}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {/* Common Telegraph Issues */}
        <div className="space-y-3">
          <h4 className="font-medium">Common Telegraph 404 Causes</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-2 p-2 bg-orange-50 rounded">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Content Policy Violation:</strong> Telegraph automatically removes content that violates their terms of service.
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Rate Limiting:</strong> Too many posts created in a short time can trigger automatic removal.
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-purple-50 rounded">
              <RefreshCw className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Temporary Issues:</strong> Telegraph pages sometimes take 10-15 minutes to become accessible.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t">
          {telegraphUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={telegraphUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Try Opening Page
              </a>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://telegra.ph', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Telegraph Homepage
          </Button>
        </div>

        {/* Recommendations */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Recommendations:</strong>
            <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
              <li>Wait 10-15 minutes before trying to access the page again</li>
              <li>Ensure your content follows Telegraph's community guidelines</li>
              <li>Avoid creating multiple posts in quick succession</li>
              <li>Use natural, high-quality content to avoid spam detection</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default Telegraph404Helper;
