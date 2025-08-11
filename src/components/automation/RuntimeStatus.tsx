import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Clock,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Pause
} from 'lucide-react';

interface RuntimeStatusProps {
  campaignsCount: number;
  activeCampaigns: number;
  systemStatus?: 'online' | 'offline' | 'maintenance';
  onRefresh?: () => void;
}

export function RuntimeStatus({ 
  campaignsCount, 
  activeCampaigns, 
  systemStatus = 'online',
  onRefresh 
}: RuntimeStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'online':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'offline':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          {/* Status Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Automation Runtime</span>
            </div>
            
            <Badge variant="outline" className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1 capitalize">{systemStatus}</span>
            </Badge>
          </div>

          {/* Stats Section */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{activeCampaigns}</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{campaignsCount}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>

            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </div>
              <div className="text-xs text-gray-500">Runtime</div>
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Activity Indicator */}
        {activeCampaigns > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <Activity className="h-3 w-3 text-green-500" />
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">
                {activeCampaigns} campaign{activeCampaigns !== 1 ? 's' : ''} running
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
