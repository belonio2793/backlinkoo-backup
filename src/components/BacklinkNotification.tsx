/**
 * Backlink Publication Notification
 * Shows toast notifications when new backlinks are published
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, ExternalLink, X, CheckCircle } from 'lucide-react';
import { realTimeFeedService, type FeedEvent } from '@/services/realTimeFeedService';

interface BacklinkNotificationProps {
  isVisible?: boolean;
}

interface NotificationData {
  id: string;
  campaignName: string;
  keyword: string;
  publishedUrl: string;
  platform: string;
  timestamp: Date;
}

export const BacklinkNotification: React.FC<BacklinkNotificationProps> = ({ 
  isVisible = true 
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!isVisible) return;

    const handleNewEvent = (event: FeedEvent) => {
      // Listen for URL published events
      if (event.type === 'url_published') {
        const notification: NotificationData = {
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          campaignName: event.campaignName || 'Campaign',
          keyword: event.keyword || 'Unknown',
          publishedUrl: event.url || '',
          platform: event.platform || 'Telegraph',
          timestamp: new Date()
        };

        setNotifications(prev => [notification, ...prev.slice(0, 2)]); // Keep max 3 notifications

        // Auto-remove after 8 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 8000);
      }
    };

    // Subscribe to real-time feed events
    realTimeFeedService.subscribe(handleNewEvent);

    return () => {
      realTimeFeedService.unsubscribe(handleNewEvent);
    };
  }, [isVisible]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-green-200 rounded-lg shadow-lg p-4 animate-slide-in-right"
          style={{
            animation: 'slideInRight 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-semibold text-green-800 text-sm">
                New Backlink Published!
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissNotification(notification.id)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {notification.platform}
              </Badge>
              <span className="text-sm font-medium text-gray-900 truncate">
                {notification.keyword}
              </span>
            </div>

            <div className="text-xs text-gray-600">
              Campaign: {notification.campaignName}
            </div>

            <div className="bg-gray-50 rounded p-2">
              <a
                href={notification.publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs font-mono truncate block"
                title={notification.publishedUrl}
              >
                {notification.publishedUrl}
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {notification.timestamp.toLocaleTimeString()}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(notification.publishedUrl);
                }}
              >
                Copy
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => window.open(notification.publishedUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

export default BacklinkNotification;
