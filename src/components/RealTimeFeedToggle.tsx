import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Eye } from 'lucide-react';

interface RealTimeFeedToggleProps {
  isVisible: boolean;
  activeCampaignsCount: number;
  onClick: () => void;
}

const RealTimeFeedToggle: React.FC<RealTimeFeedToggleProps> = ({
  isVisible,
  activeCampaignsCount,
  onClick
}) => {
  // Don't show toggle if modal is already visible or no active campaigns
  if (isVisible || activeCampaignsCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <Button
        onClick={onClick}
        className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        size="lg"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <span>Real Time Feed</span>
          {activeCampaignsCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeCampaignsCount}
            </Badge>
          )}
        </div>
      </Button>
    </div>
  );
};

export default RealTimeFeedToggle;
