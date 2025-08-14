import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Globe, TestTube, RefreshCw } from 'lucide-react';
import { ProductionModeForcer } from '@/utils/forceProductionMode';

interface TelegraphModeIndicatorProps {
  showControls?: boolean;
  compact?: boolean;
}

export function TelegraphModeIndicator({ showControls = true, compact = false }: TelegraphModeIndicatorProps) {
  const [modeStatus, setModeStatus] = useState<ReturnType<typeof ProductionModeForcer.getModeStatus> | null>(null);
  const [updating, setUpdating] = useState(false);

  const refreshStatus = () => {
    const status = ProductionModeForcer.getModeStatus();
    setModeStatus(status);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleForceProduction = async () => {
    setUpdating(true);
    try {
      ProductionModeForcer.forceProductionMode();
      ProductionModeForcer.enableLiveTelegraph();
      
      // Small delay to let the changes take effect
      await new Promise(resolve => setTimeout(resolve, 500));
      refreshStatus();
      
      // Force page refresh to apply changes
      window.location.reload();
    } finally {
      setUpdating(false);
    }
  };

  const handleReset = async () => {
    setUpdating(true);
    try {
      ProductionModeForcer.resetToAutoMode();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      refreshStatus();
      
      window.location.reload();
    } finally {
      setUpdating(false);
    }
  };

  if (!modeStatus) {
    return (
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Checking mode...</span>
      </div>
    );
  }

  const getModeBadge = () => {
    if (modeStatus.isLiveTelegraphEnabled) {
      return <Badge className="bg-green-50 text-green-700 border-green-200">Live Telegraph</Badge>;
    }
    return <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">Mock Mode</Badge>;
  };

  const getModeIcon = () => {
    return modeStatus.isLiveTelegraphEnabled ? 
      <Globe className="h-4 w-4 text-green-600" /> : 
      <TestTube className="h-4 w-4 text-orange-600" />;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getModeIcon()}
        {getModeBadge()}
        {showControls && !modeStatus.isLiveTelegraphEnabled && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleForceProduction}
            disabled={updating}
          >
            Enable Live
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Telegraph Publishing Mode
          </CardTitle>
          {getModeBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Current Environment:</strong>
            <br />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {modeStatus.currentHostname}
            </code>
          </div>
          
          <div>
            <strong>Telegraph API Mode:</strong>
            <br />
            <span className="flex items-center gap-1">
              {getModeIcon()}
              {modeStatus.isLiveTelegraphEnabled ? 'Live API' : 'Mock Service'}
            </span>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Status:</strong> {modeStatus.recommendedAction}
          </AlertDescription>
        </Alert>

        {showControls && (
          <div className="flex gap-2 pt-2 border-t">
            {!modeStatus.isLiveTelegraphEnabled && (
              <Button
                onClick={handleForceProduction}
                disabled={updating}
                className="flex-1"
              >
                <Globe className="h-4 w-4 mr-2" />
                {updating ? 'Enabling...' : 'Enable Live Telegraph'}
              </Button>
            )}
            
            {modeStatus.isProductionForced && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={updating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Auto
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 pt-2 border-t">
          <strong>Note:</strong> Live mode uses the actual Telegraph API to create real posts. 
          Mock mode simulates posting for development/testing purposes.
        </div>
      </CardContent>
    </Card>
  );
}

export default TelegraphModeIndicator;
