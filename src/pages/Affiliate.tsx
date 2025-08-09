import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, DollarSign, Gift, Copy, Share2, Trophy, Target,
  TrendingUp, Calendar, Clock, CheckCircle, Star,
  CreditCard, Wallet, Link2, Eye, RefreshCw, Download,
  Crown, Zap, Heart, Award, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAffiliate } from '@/hooks/useAffiliate';
import ToolsHeader from '@/components/shared/ToolsHeader';
import { Footer } from '@/components/Footer';

const Affiliate: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const {
    isLoading,
    stats,
    referrals,
    creditHistory,
    generateReferralLink,
    refreshData
  } = useAffiliate();

  const referralLink = generateReferralLink();
  
  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link Copied!",
        description: "Your referral link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Backlink∞ - Get Free Credits',
          text: 'Join the best link building platform and get free credits to start!',
          url: referralLink,
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <ToolsHeader />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Users className="h-10 w-10 text-purple-600" />
                <Crown className="h-5 w-5 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                Affiliate Program
              </h1>
            </div>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              Earn credits by referring new users! Get 1 credit for every $3 your referrals spend or 3 credits they purchase.
              Your referrals stay connected to you forever.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Credits</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalCredits}</p>
                  </div>
                  <Gift className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+{stats.thisMonthCredits} this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalReferrals}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+{stats.thisMonthReferrals} this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-600">${stats.totalEarnings.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs text-gray-600">Credits: ${(stats.totalCredits * 3.33).toFixed(0)} value</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.conversionRate.toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-orange-600" />
                  <span className="text-xs text-orange-600">Above average</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link Section */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Your Referral Link
              </CardTitle>
              <CardDescription>
                Share this link to earn credits when people sign up and make purchases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="bg-white"
                />
                <Button onClick={copyReferralLink} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={shareReferralLink} variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
              
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>Earning Formula:</strong> Get 1 credit for every $3 your referrals spend OR every 3 credits they purchase. 
                  Referrals are permanent - earn from their lifetime activity!
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="credits">Credit History</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Credits Earned</span>
                        <span className="text-2xl font-bold text-purple-600">{stats.thisMonthCredits}</span>
                      </div>
                      <Progress value={Math.min(100, (stats.thisMonthCredits / 50) * 100)} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">New Referrals</span>
                        <span className="text-2xl font-bold text-blue-600">{stats.thisMonthReferrals}</span>
                      </div>
                      <Progress value={Math.min(100, (stats.thisMonthReferrals / 10) * 100)} className="h-2" />

                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Conversion Rate</span>
                        <span className="text-2xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(100, stats.conversionRate)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={shareReferralLink} className="w-full justify-start">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Referral Link
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Download Marketing Materials
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Eye className="h-4 w-4 mr-2" />
                      View Affiliate Guide
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={refreshData}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh Statistics
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {creditHistory.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'referral_purchase' ? 'bg-green-100' :
                            transaction.type === 'referral_signup' ? 'bg-blue-100' :
                            transaction.type === 'bonus' ? 'bg-purple-100' : 'bg-gray-100'
                          }`}>
                            {transaction.type === 'referral_purchase' && <DollarSign className="h-4 w-4 text-green-600" />}
                            {transaction.type === 'referral_signup' && <Users className="h-4 w-4 text-blue-600" />}
                            {transaction.type === 'bonus' && <Gift className="h-4 w-4 text-purple-600" />}
                            {transaction.type === 'spent' && <CreditCard className="h-4 w-4 text-gray-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge variant={transaction.amount > 0 ? 'default' : 'secondary'}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Referrals ({referrals.length})
                  </CardTitle>
                  <CardDescription>
                    Track your referrals and their activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            referral.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium">{referral.email}</p>
                            <p className="text-sm text-gray-500">
                              Joined: {new Date(referral.joinDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-green-600">${referral.totalSpent}</p>
                              <p className="text-xs text-gray-500">Total Spent</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-purple-600">{referral.creditsGenerated}</p>
                              <p className="text-xs text-gray-500">Credits Earned</p>
                            </div>
                            <Badge variant={referral.status === 'active' ? 'default' : 'secondary'}>
                              {referral.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Credit History
                  </CardTitle>
                  <CardDescription>
                    Complete history of your credit transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {creditHistory.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'referral_purchase' ? 'bg-green-100' :
                            transaction.type === 'referral_signup' ? 'bg-blue-100' :
                            transaction.type === 'bonus' ? 'bg-purple-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'referral_purchase' && <DollarSign className="h-4 w-4 text-green-600" />}
                            {transaction.type === 'referral_signup' && <Users className="h-4 w-4 text-blue-600" />}
                            {transaction.type === 'bonus' && <Gift className="h-4 w-4 text-purple-600" />}
                            {transaction.type === 'spent' && <CreditCard className="h-4 w-4 text-red-600" />}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={transaction.amount > 0 ? 'default' : 'destructive'}
                            className={transaction.amount > 0 ? 'bg-green-100 text-green-800' : ''}
                          >
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Affiliate Rewards & Milestones
                  </CardTitle>
                  <CardDescription>
                    Unlock special bonuses as you grow your affiliate network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { milestone: '5 Referrals', reward: '10 Bonus Credits', completed: true, progress: 100 },
                      { milestone: '10 Referrals', reward: '25 Bonus Credits', completed: true, progress: 100 },
                      { milestone: '25 Referrals', reward: '75 Bonus Credits', completed: false, progress: 48 },
                      { milestone: '50 Referrals', reward: '200 Bonus Credits', completed: false, progress: 24 },
                      { milestone: '100 Referrals', reward: '500 Bonus Credits', completed: false, progress: 12 },
                      { milestone: '250 Referrals', reward: '1500 Bonus Credits', completed: false, progress: 5 }
                    ].map((item, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border-2 ${
                        item.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{item.milestone}</h4>
                          {item.completed && <CheckCircle className="h-5 w-5 text-green-600" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{item.reward}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    VIP Affiliate Program
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <Crown className="h-12 w-12 text-yellow-500 mx-auto" />
                    <h3 className="text-xl font-bold">Reach 100 Referrals</h3>
                    <p className="text-gray-600">
                      Unlock VIP status with exclusive benefits: Higher commission rates, 
                      priority support, custom landing pages, and monthly bonus rewards!
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">2x</p>
                        <p className="text-sm text-gray-600">Commission Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">24/7</p>
                        <p className="text-sm text-gray-600">Priority Support</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Affiliate;
