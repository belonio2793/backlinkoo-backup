/**
 * Modern Environment Variables Manager - Security Notice
 * Client-side environment variable management has been disabled for security
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Lock, Server } from 'lucide-react';

export function ModernEnvironmentVariablesManager() {
  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Shield className="w-5 h-5" />
            Environment Variables - Security Notice
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <div className="font-medium">Client-side environment variable management has been disabled for security reasons.</div>
                
                <div className="space-y-2">
                  <div className="font-medium text-sm">Why this was removed:</div>
                  <div className="space-y-1 text-sm">
                    <div>• API keys and secrets should never be exposed in browser environments</div>
                    <div>• Environment variables containing sensitive data are security risks</div>
                    <div>• Client-side configuration can be easily inspected and compromised</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium text-sm">Secure alternatives:</div>
                  <div className="space-y-1 text-sm">
                    <div>• Use server-side environment variable configuration</div>
                    <div>• Configure variables through hosting platform dashboards</div>
                    <div>• Use the DevServerControl tool for development environments</div>
                    <div>• Set up CI/CD pipelines with secure variable injection</div>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Server-Side Setup</span>
                </div>
                <div className="space-y-1 text-sm text-blue-700">
                  <div>• Environment variables in hosting platform</div>
                  <div>• Server configuration files</div>
                  <div>• Secure deployment pipelines</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Security Best Practices</span>
                </div>
                <div className="space-y-1 text-sm text-green-700">
                  <div>• Never commit secrets to version control</div>
                  <div>• Use environment-specific configurations</div>
                  <div>• Implement secret rotation policies</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              <span className="font-medium">For Development:</span> Use the DevServerControl tool or your local .env files to configure environment variables securely.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
