/**
 * Admin Environment Variables Manager - Security Notice
 * Client-side environment variable management has been disabled for security
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Terminal, Settings } from 'lucide-react';

interface EnvironmentVariable {
  key: string;
  value: string;
  required: boolean;
  description: string;
  category: string;
  is_secret: boolean;
}

export function EnvironmentVariablesManager() {
  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Shield className="w-5 h-5" />
            Admin Environment Variables - Security Notice
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-3">
                <div className="font-medium">Administrative environment variable management has been moved to server-side for security.</div>
                
                <div className="space-y-2">
                  <div className="font-medium text-sm">Security concerns addressed:</div>
                  <div className="space-y-1 text-sm">
                    <div>• Database credentials and API keys are no longer exposed client-side</div>
                    <div>• Admin tokens and secrets are protected from browser inspection</div>
                    <div>• Environment configuration is isolated from user access</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium text-sm">Admin configuration options:</div>
                  <div className="space-y-1 text-sm">
                    <div>• Use hosting platform environment variable settings</div>
                    <div>• Configure through deployment pipeline</div>
                    <div>• Set variables via DevServerControl tool for development</div>
                    <div>• Access server-side configuration files directly</div>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Development Setup</span>
                </div>
                <div className="space-y-1 text-sm text-blue-700">
                  <div>• Use DevServerControl tool: <code className="bg-blue-100 px-1 rounded">set_env_variable</code></div>
                  <div>• Configure local .env files securely</div>
                  <div>• Access environment through server-side functions</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Production Setup</span>
                </div>
                <div className="space-y-1 text-sm text-purple-700">
                  <div>• Configure via hosting platform (Netlify, Vercel, etc.)</div>
                  <div>• Use CI/CD environment variable injection</div>
                  <div>• Implement secret management systems</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Note:</span> This change improves security by preventing accidental exposure of sensitive credentials in client-side code.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
