import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast } from 'sonner';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Zap,
  Target,
  TrendingUp,
  Gift,
  Users,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  Lock,
  Unlock,
  Flame,
  Mountain,
  Rocket,
  Diamond,
  Shield
} from 'lucide-react';

interface AffiliateGamificationProps {
  affiliateId: string;
  currentTier: string;
  totalEarnings: number;
  totalConversions: number;
  totalReferrals: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: string;
  progress?: number;
  maxProgress?: number;
  unlocked: boolean;
  unlockedAt?: string;
  reward?: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  type: 'earnings' | 'conversions' | 'referrals' | 'streak';
  targetValue: number;
  currentValue: number;
  reward: {
    type: 'bonus' | 'tier_upgrade' | 'badge' | 'credits';
    value: number;
    description: string;
  };
  completed: boolean;
  completedAt?: string;
}

interface LeaderboardEntry {
  rank: number;
  affiliateId: string;
  name: string;
  tier: string;
  earnings: number;
  conversions: number;
  badge?: string;
  isCurrentUser?: boolean;
}

export const AffiliateGamification: React.FC<AffiliateGamificationProps> = ({
  affiliateId,
  currentTier,
  totalEarnings,
  totalConversions,
  totalReferrals
}) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'all'>('monthly');
  const [userRank, setUserRank] = useState<number>(0);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    loadGamificationData();
  }, [affiliateId]);

  const loadGamificationData = async () => {
    try {
      // Mock data - in real implementation, this would come from the API
      const mockBadges: Badge[] = [
        {
          id: 'first_sale',
          name: 'First Blood',
          description: 'Achieved your first conversion',
          icon: Target,
          rarity: 'common',
          requirement: 'Get 1 conversion',
          unlocked: totalConversions >= 1,
          unlockedAt: totalConversions >= 1 ? '2024-01-15T00:00:00Z' : undefined,
          reward: '$10 bonus'
        },
        {
          id: 'ten_conversions',
          name: 'Rising Star',
          description: 'Achieved 10 conversions',
          icon: Star,
          rarity: 'rare',
          requirement: 'Get 10 conversions',
          progress: Math.min(totalConversions, 10),
          maxProgress: 10,
          unlocked: totalConversions >= 10,
          unlockedAt: totalConversions >= 10 ? '2024-01-20T00:00:00Z' : undefined,
          reward: '$50 bonus'
        },
        {
          id: 'thousand_earnings',
          name: 'Money Maker',
          description: 'Earned $1,000 in commissions',
          icon: DollarSign,
          rarity: 'rare',
          requirement: 'Earn $1,000',
          progress: Math.min(totalEarnings, 1000),
          maxProgress: 1000,
          unlocked: totalEarnings >= 1000,
          unlockedAt: totalEarnings >= 1000 ? '2024-01-25T00:00:00Z' : undefined,
          reward: 'Tier upgrade'
        },
        {
          id: 'fifty_conversions',
          name: 'Conversion Master',
          description: 'Achieved 50 conversions',
          icon: Trophy,
          rarity: 'epic',
          requirement: 'Get 50 conversions',
          progress: Math.min(totalConversions, 50),
          maxProgress: 50,
          unlocked: totalConversions >= 50,
          reward: '$200 bonus + exclusive assets'
        },
        {
          id: 'top_performer',
          name: 'Elite Performer',
          description: 'Ranked #1 on monthly leaderboard',
          icon: Crown,
          rarity: 'legendary',
          requirement: 'Rank #1 monthly',
          unlocked: false,
          reward: '$500 bonus + special recognition'
        },
        {
          id: 'streak_master',
          name: 'Consistency King',
          description: 'Generated conversions for 30 consecutive days',
          icon: Flame,
          rarity: 'epic',
          requirement: '30-day conversion streak',
          progress: streakDays,
          maxProgress: 30,
          unlocked: streakDays >= 30,
          reward: '$100 bonus + streak multiplier'
        }
      ];

      const mockMilestones: Milestone[] = [
        {
          id: 'milestone_1',
          name: 'Quick Start',
          description: 'Achieve your first 5 conversions',
          type: 'conversions',
          targetValue: 5,
          currentValue: totalConversions,
          reward: {
            type: 'bonus',
            value: 25,
            description: '$25 bonus reward'
          },
          completed: totalConversions >= 5,
          completedAt: totalConversions >= 5 ? '2024-01-18T00:00:00Z' : undefined
        },
        {
          id: 'milestone_2',
          name: 'Revenue Builder',
          description: 'Earn $500 in total commissions',
          type: 'earnings',
          targetValue: 500,
          currentValue: totalEarnings,
          reward: {
            type: 'bonus',
            value: 50,
            description: '$50 bonus + commission rate increase'
          },
          completed: totalEarnings >= 500,
          completedAt: totalEarnings >= 500 ? '2024-01-22T00:00:00Z' : undefined
        },
        {
          id: 'milestone_3',
          name: 'Network Builder',
          description: 'Generate 100 quality referrals',
          type: 'referrals',
          targetValue: 100,
          currentValue: totalReferrals,
          reward: {
            type: 'tier_upgrade',
            value: 1,
            description: 'Automatic tier upgrade'
          },
          completed: totalReferrals >= 100
        },
        {
          id: 'milestone_4',
          name: 'Master Marketer',
          description: 'Earn $2,000 in total commissions',
          type: 'earnings',
          targetValue: 2000,
          currentValue: totalEarnings,
          reward: {
            type: 'bonus',
            value: 200,
            description: '$200 bonus + exclusive partner status'
          },
          completed: totalEarnings >= 2000
        }
      ];

      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, affiliateId: 'BL123ABC', name: 'Sarah M.', tier: 'platinum', earnings: 15247, conversions: 87 },
        { rank: 2, affiliateId: 'BL456DEF', name: 'Mike J.', tier: 'gold', earnings: 12456, conversions: 73 },
        { rank: 3, affiliateId: 'BL789GHI', name: 'Lisa C.', tier: 'gold', earnings: 8932, conversions: 54 },
        { rank: 4, affiliateId: 'BL101JKL', name: 'David R.', tier: 'silver', earnings: 6543, conversions: 41 },
        { rank: 5, affiliateId: affiliateId, name: 'You', tier: currentTier, earnings: totalEarnings, conversions: totalConversions, isCurrentUser: true }
      ];

      setBadges(mockBadges);
      setMilestones(mockMilestones);
      setLeaderboard(mockLeaderboard);
      setUserRank(mockLeaderboard.findIndex(entry => entry.affiliateId === affiliateId) + 1);
      setStreakDays(15); // Mock streak data
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    }
  };

  const claimMilestoneReward = async (milestoneId: string) => {
    try {
      // API call to claim reward
      toast.success('Milestone reward claimed!');
      loadGamificationData();
    } catch (error) {
      toast.error('Failed to claim reward');
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-100 text-gray-800 border-gray-200',
      rare: 'bg-blue-100 text-blue-800 border-blue-200',
      epic: 'bg-purple-100 text-purple-800 border-purple-200',
      legendary: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

  const getTierIcon = (tier: string) => {
    const icons = {
      bronze: Shield,
      silver: Award,
      gold: Trophy,
      platinum: Crown,
      partner: Diamond
    };
    return icons[tier as keyof typeof icons] || Shield;
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'text-amber-600',
      silver: 'text-gray-600',
      gold: 'text-yellow-600',
      platinum: 'text-purple-600',
      partner: 'text-blue-600'
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Affiliate Achievements</h1>
        <p className="text-gray-600">Unlock badges, complete milestones, and climb the leaderboard</p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Crown className="w-12 h-12 text-primary mx-auto mb-2" />
              <Badge className="bg-primary text-white">Current Rank</Badge>
            </div>
            <p className="text-3xl font-bold text-primary">#{userRank}</p>
            <p className="text-sm text-gray-600">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Award className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <Badge variant="outline">Badges Earned</Badge>
            </div>
            <p className="text-3xl font-bold">{badges.filter(b => b.unlocked).length}</p>
            <p className="text-sm text-gray-600">of {badges.length} available</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Target className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <Badge variant="outline">Milestones</Badge>
            </div>
            <p className="text-3xl font-bold">{milestones.filter(m => m.completed).length}</p>
            <p className="text-sm text-gray-600">of {milestones.length} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Flame className="w-12 h-12 text-red-600 mx-auto mb-2" />
              <Badge variant="outline">Current Streak</Badge>
            </div>
            <p className="text-3xl font-bold">{streakDays}</p>
            <p className="text-sm text-gray-600">days active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievement Badges
            </CardTitle>
            <CardDescription>Unlock badges by completing challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map(badge => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      badge.unlocked 
                        ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${badge.unlocked ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {badge.unlocked ? (
                          <Icon className="w-6 h-6 text-green-600" />
                        ) : (
                          <Lock className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{badge.name}</h4>
                          <Badge className={`text-xs ${getRarityColor(badge.rarity)}`}>
                            {badge.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                        
                        {badge.maxProgress && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{badge.progress || 0}</span>
                              <span>{badge.maxProgress}</span>
                            </div>
                            <Progress 
                              value={((badge.progress || 0) / badge.maxProgress) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                        
                        {badge.unlocked && badge.reward && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              <Gift className="w-3 h-3 mr-1" />
                              {badge.reward}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Milestones Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mountain className="w-5 h-5" />
              Milestones
            </CardTitle>
            <CardDescription>Complete milestones to earn rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border ${
                    milestone.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{milestone.name}</h4>
                      <p className="text-sm text-gray-600">{milestone.description}</p>
                    </div>
                    {milestone.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{milestone.currentValue} / {milestone.targetValue}</span>
                    </div>
                    <Progress 
                      value={(milestone.currentValue / milestone.targetValue) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-xs">
                      <Gift className="w-3 h-3 mr-1" />
                      {milestone.reward.description}
                    </Badge>
                    
                    {milestone.completed && !milestone.completedAt && (
                      <Button 
                        size="sm"
                        onClick={() => claimMilestoneReward(milestone.id)}
                      >
                        Claim Reward
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Affiliate Leaderboard
              </CardTitle>
              <CardDescription>Top performing affiliates this month</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button
                variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={selectedPeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('all')}
              >
                All Time
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map(entry => {
              const TierIcon = getTierIcon(entry.tier);
              return (
                <div
                  key={entry.affiliateId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    entry.isCurrentUser 
                      ? 'bg-primary/5 border-primary/20 ring-2 ring-primary/10' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      entry.rank === 1 ? 'bg-yellow-500' :
                      entry.rank === 2 ? 'bg-gray-400' :
                      entry.rank === 3 ? 'bg-amber-600' :
                      'bg-gray-500'
                    }`}>
                      {entry.rank <= 3 ? (
                        entry.rank === 1 ? <Crown className="w-4 h-4" /> :
                        entry.rank === 2 ? <Medal className="w-4 h-4" /> :
                        <Award className="w-4 h-4" />
                      ) : (
                        entry.rank
                      )}
                    </div>
                    
                    <Avatar>
                      <AvatarFallback>{entry.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{entry.name}</span>
                        {entry.isCurrentUser && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TierIcon className={`w-4 h-4 ${getTierColor(entry.tier)}`} />
                        <span className="capitalize">{entry.tier}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(entry.earnings)}</p>
                    <p className="text-sm text-gray-600">{entry.conversions} conversions</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateGamification;
