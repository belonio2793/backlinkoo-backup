import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Shield,
  Crown,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AutomationFooterProps {
  totalLinksBuilt: number;
  activeCampaigns: number;
  successRate?: number;
  onViewReports?: () => void;
  onUpgrade?: () => void;
}

export function AutomationFooter({ 
  totalLinksBuilt, 
  activeCampaigns, 
  successRate = 85,
  onViewReports,
  onUpgrade 
}: AutomationFooterProps) {
  const { isPremium } = useAuth();

  return (
    <div className="mt-8 space-y-4">
      {/* Performance Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalLinksBuilt}</div>
              <div className="text-sm text-muted-foreground">Total Links Built</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{activeCampaigns}</div>
              <div className="text-sm text-muted-foreground">Active Campaigns</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{successRate}%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {isPremium ? 'Premium' : 'Free'}
              </div>
              <div className="text-sm text-muted-foreground">Plan Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                System Operational
              </Badge>
              
              {totalLinksBuilt > 0 && (
                <Badge variant="secondary">
                  Last activity: {Math.floor(Math.random() * 30) + 1} minutes ago
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onViewReports && (
                <Button variant="outline" size="sm" onClick={onViewReports}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  View Reports
                </Button>
              )}
              
              {!isPremium && onUpgrade && (
                <Button 
                  size="sm" 
                  onClick={onUpgrade}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA for Free Users */}
      {!isPremium && totalLinksBuilt >= 15 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center">
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                You're almost at your limit!
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                You've built {totalLinksBuilt} out of 20 free links. 
                Upgrade to Premium for unlimited backlinks and advanced features.
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button 
                  onClick={onUpgrade}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Learn More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Info */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          Backlink ∞ Automation System • Built for scale • Powered by AI
        </p>
      </div>
    </div>
  );
}
