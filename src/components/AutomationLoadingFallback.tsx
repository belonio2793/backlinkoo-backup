/**
 * Loading fallback component for Automation feature
 * Provides progressive loading with helpful information
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Zap, Database, Settings } from 'lucide-react';

interface AutomationLoadingFallbackProps {
  isCheckingDatabase?: boolean;
  progress?: number;
  stage?: 'initializing' | 'checking-database' | 'loading-campaigns' | 'ready';
}

export function AutomationLoadingFallback({ 
  isCheckingDatabase = true, 
  progress = 0,
  stage = 'initializing' 
}: AutomationLoadingFallbackProps) {
  const getStageInfo = () => {
    switch (stage) {
      case 'initializing':
        return {
          icon: <Settings className="h-4 w-4" />,
          title: 'Initializing Automation Platform',
          description: 'Setting up your enterprise-grade link building environment...'
        };
      case 'checking-database':
        return {
          icon: <Database className="h-4 w-4" />,
          title: 'Checking Database Connection',
          description: 'Verifying database connectivity and table structure...'
        };
      case 'loading-campaigns':
        return {
          icon: <Zap className="h-4 w-4" />,
          title: 'Loading Campaign Data',
          description: 'Restoring your campaigns and metrics...'
        };
      default:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          title: 'Starting Up',
          description: 'Preparing your automation dashboard...'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Backlink ∞ Automation</h1>
          </div>
          <p className="text-gray-600">Enterprise-Grade Link Building Platform</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {stageInfo.icon}
              {stageInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{stageInfo.description}</p>
            
            <Progress value={progress} className="w-full" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">Campaign Manager</div>
                <div className="text-sm text-blue-700">Create & manage campaigns</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-900">Link Discovery</div>
                <div className="text-sm text-green-700">AI-powered opportunity finder</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-900">Real-time Analytics</div>
                <div className="text-sm text-purple-700">Live performance tracking</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isCheckingDatabase && (
          <Alert className="border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <strong>System Check:</strong> Verifying database connection and preparing your workspace...
              <div className="mt-2 text-sm text-blue-700">
                This usually takes just a few seconds. If you see this for more than 10 seconds, 
                the system will automatically switch to fallback mode.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Powered by advanced AI engines and enterprise-grade infrastructure</p>
        </div>
      </div>
    </div>
  );
}

export default AutomationLoadingFallback;
