/**
 * Development Mode Indicator
 * Shows when the automation system is running in development mode
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wrench, TestTube, Globe } from 'lucide-react';

interface DevelopmentModeIndicatorProps {
  isVisible?: boolean;
}

export const DevelopmentModeIndicator: React.FC<DevelopmentModeIndicatorProps> = ({ 
  isVisible = true 
}) => {
  // Check if we're in development environment
  const isDevelopment = 
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('.netlify.app') ||
    window.location.hostname.includes('.dev') ||
    import.meta.env.DEV;

  if (!isDevelopment || !isVisible) {
    return null;
  }

  const handleTestProcessor = async () => {
    try {
      if ((window as any).testDevelopmentProcessor) {
        await (window as any).testDevelopmentProcessor();
      } else {
        const { DevelopmentCampaignProcessor } = await import('@/services/developmentCampaignProcessor');
        await DevelopmentCampaignProcessor.runTest();
      }
    } catch (error) {
      console.error('Development processor test failed:', error);
    }
  };

  const handleTestTelegraph = async () => {
    try {
      const { default: MockTelegraphPublisher } = await import('@/services/mockTelegraphPublisher');
      const result = await MockTelegraphPublisher.publishTestContent();
      
      if (result.success) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Telegraph test failed:', error);
    }
  };

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Wrench className="h-4 w-4" />
      <AlertDescription className="text-amber-800">
        <div className="flex items-center justify-between">
          <div>
            <strong>Development Mode Active</strong>
            <div className="text-sm mt-1 opacity-90">
              Using mock content generation + real Telegraph.ph publishing
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={handleTestProcessor}
            >
              <TestTube className="w-4 h-4 mr-1" />
              Test System
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={handleTestTelegraph}
            >
              <Globe className="w-4 h-4 mr-1" />
              Test Telegraph
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default DevelopmentModeIndicator;
