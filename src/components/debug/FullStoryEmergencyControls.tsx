import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isFullStoryPresent, isFullStoryError } from '@/utils/fullstoryWorkaround';

export function FullStoryEmergencyControls() {
  const [fullStoryDetected, setFullStoryDetected] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setFullStoryDetected(isFullStoryPresent());
    setDisabled(localStorage.getItem('disable_fullstory') === 'true');
  }, []);

  const disableFullStory = () => {
    try {
      // Method 1: Shutdown FullStory if present
      if ((window as any).FS && typeof (window as any).FS.shutdown === 'function') {
        (window as any).FS.shutdown();
        console.log('✅ FullStory shutdown complete');
      }

      // Method 2: Set localStorage flag
      localStorage.setItem('disable_fullstory', 'true');
      
      // Method 3: Remove FullStory scripts
      const scripts = document.querySelectorAll('script[src*="fullstory"], script[src*="fs.js"]');
      scripts.forEach(script => script.remove());

      setDisabled(true);
      console.log('🚫 FullStory disabled');
      
      // Reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error disabling FullStory:', error);
    }
  };

  const enableFullStory = () => {
    localStorage.removeItem('disable_fullstory');
    setDisabled(false);
    console.log('✅ FullStory enabled - reload required');
    window.location.reload();
  };

  const testFetch = async () => {
    try {
      console.log('🧪 Testing fetch with FullStory detection...');
      
      const response = await fetch('/api/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✅ Fetch test successful:', response.status);
    } catch (error: any) {
      console.error('❌ Fetch test failed:', error);
      
      if (isFullStoryError(error)) {
        console.warn('🚫 FullStory interference detected in fetch test');
        return 'fullstory-error';
      }
      return 'unknown-error';
    }
  };

  if (!fullStoryDetected && !disabled) {
    return null; // Don't show if FullStory is not present
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertDescription className="text-sm">
          {fullStoryDetected && (
            <div className="space-y-2">
              <div className="font-medium text-orange-800">
                🔍 FullStory Analytics Detected
              </div>
              
              {disabled ? (
                <div className="space-y-2">
                  <p className="text-orange-700">FullStory is currently disabled.</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={enableFullStory}
                    className="w-full"
                  >
                    Enable FullStory
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-orange-700">
                    If you're experiencing fetch errors or network issues, try disabling FullStory.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={disableFullStory}
                      className="flex-1"
                    >
                      Disable FullStory
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={testFetch}
                      className="flex-1"
                    >
                      Test Fetch
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
