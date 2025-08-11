import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Zap, 
  Infinity, 
  Shield, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Star,
  Rocket,
  Award
} from 'lucide-react';
import { AutoPauseRunService, PremiumTrigger } from '@/services/autoPauseRunService';
import { toast } from 'sonner';

interface PremiumUpgradeModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: string) => void;
  triggerId?: string;
}

export function PremiumUpgradeModal({ 
  userId, 
  isOpen, 
  onClose, 
  onUpgrade,
  triggerId 
}: PremiumUpgradeModalProps) {
  const [premiumTriggers, setPremiumTriggers] = useState<PremiumTrigger[]>([]);
  const [selectedTier, setSelectedTier] = useState<'premium' | 'enterprise'>('premium');
  const [loading, setLoading] = useState(false);

  // Load premium triggers
  useEffect(() => {
    if (isOpen && userId) {
      loadPremiumTriggers();
    }
  }, [isOpen, userId]);

  const loadPremiumTriggers = async () => {
    try {
      const triggers = await AutoPauseRunService.getPremiumTriggers(userId);
      setPremiumTriggers(triggers);

      // Auto-select suggested tier from highest priority trigger
      if (triggers.length > 0) {
        const highestPriorityTrigger = triggers[0];
        const suggestedTier = highestPriorityTrigger.trigger_data.suggested_tier;
        if (suggestedTier === 'premium' || suggestedTier === 'enterprise') {
          setSelectedTier(suggestedTier);
        }
      }
    } catch (error) {
      console.error('Error loading premium triggers:', error);
    }
  };

  const handleDismiss = async () => {
    if (triggerId) {
      await AutoPauseRunService.respondToPremiumTrigger(triggerId, 'dismissed');
    }
    
    // Dismiss all triggers
    for (const trigger of premiumTriggers) {
      await AutoPauseRunService.respondToPremiumTrigger(trigger.id, 'dismissed');
    }
    
    onClose();
  };

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      if (triggerId) {
        await AutoPauseRunService.respondToPremiumTrigger(triggerId, 'upgraded');
      }

      // Mark all triggers as upgraded
      for (const trigger of premiumTriggers) {
        await AutoPauseRunService.respondToPremiumTrigger(trigger.id, 'upgraded');
      }

      onUpgrade(selectedTier);
      toast.success('Upgrade initiated!', {
        description: `Redirecting to ${selectedTier} plan checkout...`
      });
    } catch (error) {
      console.error('Error handling upgrade:', error);
      toast.error('Failed to process upgrade request');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getUrgencyIcon = (urgency?: string) => {
    switch (urgency) {
      case 'critical': return AlertTriangle;
      case 'high': return XCircle;
      case 'medium': return Clock;
      default: return CheckCircle;
    }
  };

  const primaryTrigger = premiumTriggers[0];
  const urgencyLevel = primaryTrigger?.trigger_data.urgency_level || 'low';

  const tierPlans = {
    premium: {
      name: 'Premium',
      price: '$49/month',
      icon: Crown,
      color: 'bg-gradient-to-r from-purple-500 to-blue-500',
      features: [
        '500 links per day (25x increase)',
        'Auto-run campaigns',
        '10x more compute power',
        'Advanced targeting',
        'Priority support',
        'Smart scheduling',
        'Quality monitoring',
        'API access'
      ],
      savings: '80% cost reduction per link'
    },
    enterprise: {
      name: 'Enterprise',
      price: '$149/month',
      icon: Rocket,
      color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      features: [
        'Unlimited everything',
        'Competitive monitoring',
        'White-label solution',
        'Dedicated resources',
        'Custom integrations',
        'Advanced analytics',
        '24/7 phone support',
        'Custom training'
      ],
      savings: '90% cost reduction per link'
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className={`p-2 rounded-full ${getUrgencyColor(urgencyLevel)}`}>
              {urgencyLevel === 'critical' ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <Crown className="h-6 w-6" />
              )}
            </div>
            {urgencyLevel === 'critical' ? 'Campaign Limits Reached!' : 'Upgrade to Premium'}
          </DialogTitle>
          <DialogDescription>
            {primaryTrigger ? (
              <div className="space-y-2">
                <p>Your campaign has been auto-paused due to tier limitations.</p>
                <div className="flex items-center gap-2">
                  <Badge className={getUrgencyColor(urgencyLevel)}>
                    {urgencyLevel.toUpperCase()} PRIORITY
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Triggered by: {primaryTrigger.trigger_data.limit_hit}
                  </span>
                </div>
              </div>
            ) : (
              'Unlock unlimited campaigns, auto-run functionality, and advanced features.'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Current Limitations */}
        {primaryTrigger && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Current Limitations Hit:</h3>
            <div className="space-y-2">
              {primaryTrigger.trigger_data.limit_hit?.split(', ').map((limit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-red-700">
                  <XCircle className="h-4 w-4" />
                  <span className="capitalize">{limit.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(tierPlans).map(([tierKey, plan]) => {
            const TierIcon = plan.icon;
            const isSelected = selectedTier === tierKey;
            const isRecommended = primaryTrigger?.trigger_data.suggested_tier === tierKey;
            
            return (
              <div
                key={tierKey}
                className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTier(tierKey as any)}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-4">
                    <Badge className="bg-green-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      RECOMMENDED
                    </Badge>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${plan.color} text-white`}>
                        <TierIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <p className="text-sm text-gray-600">{plan.savings}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{plan.price}</p>
                      <p className="text-xs text-gray-500">billed monthly</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex items-center justify-center py-2">
                      <Badge className="bg-blue-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        SELECTED
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Comparison */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            What You'll Get With {tierPlans[selectedTier].name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Immediate Benefits</h4>
              <ul className="space-y-1 text-sm">
                {primaryTrigger?.trigger_data.benefits?.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-blue-600" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Advanced Features</h4>
              <ul className="space-y-1 text-sm">
                {primaryTrigger?.trigger_data.benefits?.slice(3).map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Rocket className="h-3 w-3 text-purple-600" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Urgency Indicator */}
        {urgencyLevel === 'critical' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-800">Limited Time Offer</span>
            </div>
            <p className="text-sm text-orange-700">
              Upgrade now to immediately resume your campaigns and get <strong>20% off your first month</strong>!
            </p>
            <div className="mt-2">
              <Progress value={75} className="h-2" />
              <p className="text-xs text-orange-600 mt-1">Offer expires in 2 hours</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={loading}
          >
            Maybe Later
          </Button>
          
          <div className="flex items-center gap-3">
            {urgencyLevel === 'critical' && (
              <div className="text-right text-sm text-gray-600">
                <p>Your campaign is paused</p>
                <p className="font-medium">Upgrade to resume immediately</p>
              </div>
            )}
            
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className={`${tierPlans[selectedTier].color} text-white px-8`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Upgrade to {tierPlans[selectedTier].name}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>30-day money back</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span>Instant activation</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mini upgrade trigger component for subtle prompts
export function MiniUpgradeTrigger({ 
  userId, 
  trigger, 
  onUpgrade 
}: { 
  userId: string; 
  trigger: PremiumTrigger; 
  onUpgrade: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = async () => {
    await AutoPauseRunService.respondToPremiumTrigger(trigger.id, 'dismissed');
    setDismissed(true);
  };

  if (dismissed) return null;

  const UrgencyIcon = getUrgencyIcon(trigger.trigger_data.urgency_level);
  const urgencyColor = getUrgencyColor(trigger.trigger_data.urgency_level);

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${urgencyColor} bg-opacity-10`}>
      <div className="flex items-center gap-3">
        <UrgencyIcon className={`h-4 w-4 ${urgencyColor.split(' ')[0]}`} />
        <div>
          <p className="text-sm font-medium">
            {trigger.trigger_data.urgency_level === 'critical' ? 'Campaign Paused' : 'Upgrade Available'}
          </p>
          <p className="text-xs text-gray-600">
            {trigger.trigger_data.limit_hit}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          <XCircle className="h-3 w-3" />
        </Button>
        <Button size="sm" onClick={onUpgrade}>
          <Crown className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      </div>
    </div>
  );
}
