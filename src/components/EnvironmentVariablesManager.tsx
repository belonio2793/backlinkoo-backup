import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface EnvironmentVariablesManagerProps {
  onConfigurationChange?: (config: { [key: string]: string }) => void;
}

export const EnvironmentVariablesManager: React.FC<EnvironmentVariablesManagerProps> = () => {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Shield className="w-5 h-5" />
          Environment Configuration - Security Notice
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <div className="font-medium">Client-side environment configuration has been disabled for security reasons.</div>
              <div className="space-y-1 text-sm">
                <div>• API keys and tokens should never be exposed in the browser</div>
                <div>• Environment variables are now managed server-side only</div>
                <div>• Contact your administrator to configure credentials securely</div>
                <div>• Use the DevServerControl tool or server environment to set variables</div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EnvironmentVariablesManager;
