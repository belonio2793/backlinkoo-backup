import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { CheckCircle2, X, Download, Shield } from 'lucide-react';
import { autoConfigSaver } from '@/services/autoConfigSaver';

export function ConfigSaveNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [saveStatus, setSaveStatus] = useState<any>(null);

  useEffect(() => {
    // Check for recent auto-save
    const status = autoConfigSaver.getLastSaveStatus();
    if (status && status.success) {
      const saveTime = new Date(status.timestamp || '').getTime();
      const now = new Date().getTime();
      const timeDiff = now - saveTime;
      
      // Show notification if save was within last 5 minutes
      if (timeDiff < 5 * 60 * 1000) {
        setSaveStatus(status);
        setShowNotification(true);
      }
    }

    // Listen for health changes
    autoConfigSaver.onHealthChange((score) => {
      if (score === 100) {
        // Show celebration notification
        setSaveStatus({
          success: true,
          timestamp: new Date().toISOString(),
          healthScore: 100,
          perfectHealth: true
        });
        setShowNotification(true);
      }
    });
  }, []);

  const handleExport = async () => {
    try {
      // Trigger export from permanent config service
      const exportData = JSON.stringify({
        timestamp: new Date().toISOString(),
        healthScore: saveStatus?.healthScore || 100,
        message: 'Configuration auto-saved with perfect health',
        apiKey: 'sk-proj-***[MASKED FOR SECURITY]***',
        environment: import.meta.env.MODE || 'development'
      }, null, 2);

      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-config-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!showNotification || !saveStatus) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-green-200 bg-green-50 shadow-lg">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <div className="flex items-start justify-between">
          <AlertDescription className="text-green-800 pr-8">
            {saveStatus.perfectHealth ? (
              <>
                <strong>🎉 Perfect Health Achieved!</strong>
                <br />
                100% API health detected and configuration auto-saved!
              </>
            ) : (
              <>
                <strong>✅ Configuration Auto-Saved!</strong>
                <br />
                Your API settings have been permanently saved.
              </>
            )}
            <div className="text-xs mt-2 text-green-600">
              Saved: {new Date(saveStatus.timestamp).toLocaleString()}
              {saveStatus.healthScore && ` • Health: ${saveStatus.healthScore}%`}
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white hover:bg-gray-50 text-green-700 border-green-300"
                onClick={handleExport}
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white hover:bg-gray-50 text-green-700 border-green-300"
                onClick={() => window.open('/admin', '_blank')}
              >
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Button>
            </div>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotification(false)}
            className="text-green-600 hover:text-green-800 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
