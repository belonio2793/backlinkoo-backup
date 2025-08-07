import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';

const SafeAffiliateProgram: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [affiliateData, setAffiliateData] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (user) {
      loadAffiliateData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAffiliateData = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading affiliate data:', error);
      }

      setAffiliateData(data);
    } catch (error) {
      console.error('Failed to load affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateCode = () => {
    const prefix = 'BL';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };

  const joinProgram = async () => {
    if (!user) return;
    
    setIsJoining(true);
    try {
      const affiliateCode = generateAffiliateCode();
      const customId = Math.random().toString(36).substr(2, 8).toUpperCase();
      const referralUrl = `${window.location.origin}?ref=${affiliateCode}`;

      const { data, error } = await supabase
        .from('affiliate_programs')
        .insert({
          user_id: user.id,
          affiliate_code: affiliateCode,
          custom_id: customId,
          status: 'active',
          commission_rate: 0.20,
          total_earnings: 0,
          total_paid: 0,
          pending_earnings: 0,
          referral_url: referralUrl
        })
        .select()
        .single();

      if (error) throw error;

      setAffiliateData(data);
      
      if (toast) {
        toast({
          title: "🎉 Welcome to the Affiliate Program!",
          description: "Your account is active and ready to earn commissions!"
        });
      }
    } catch (error: any) {
      console.error('Error joining affiliate program:', error);
      if (toast) {
        toast({
          title: "Join failed",
          description: error.message || "Please try again",
          variant: "destructive"
        });
      }
    } finally {
      setIsJoining(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (toast) {
        toast({
          title: "Copied!",
          description: "Link copied to clipboard"
        });
      }
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (toast) {
        toast({
          title: "Copied!",
          description: "Link copied to clipboard"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header with Login/Signup */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">∞</span>
                <span className="text-xl font-bold text-gray-900">Backlinkoo Affiliates</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Join Program
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center">
            {/* Auth Required Notice */}
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-orange-600">🔒</span>
                <span className="font-semibold text-orange-800">Account Required</span>
              </div>
              <p className="text-orange-700 text-sm">
                Please sign in or create an account to access the affiliate program.
                Your user ID is linked to your affiliate tracking for accurate commission attribution.
              </p>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Earn <span className="text-blue-600">$10,000+</span> Monthly
              <br />
              with Backlinkoo Affiliate Program
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join the most lucrative affiliate program in the SEO industry. Earn up to 35%
              recurring commissions promoting the world's leading backlink building platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                onClick={() => navigate('/login')}
              >
                🚀 Create Account & Join
              </button>
              <button
                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                onClick={() => navigate('/login')}
              >
                📱 Sign In to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-green-200">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Up to 35% Commission</h3>
                <p className="text-gray-600 mb-4">Start at 20% and earn up to 35% recurring commissions</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Bronze:</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Silver:</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gold:</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platinum:</span>
                    <span className="font-semibold">35%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-blue-200">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">⏰</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">30-Day Cookies</h3>
                <p className="text-gray-600 mb-4">Extended attribution window ensures maximum earnings</p>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Cross-device tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Session persistence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>First-click attribution</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border-2 border-purple-200">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Premium Tools</h3>
                <p className="text-gray-600 mb-4">Complete marketing toolkit and dedicated support</p>
                <div className="space-y-2 text-sm text-purple-700">
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Marketing asset library</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Real-time analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Dedicated support team</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join the Backlinkoo Affiliate Program</h1>
            <p className="text-gray-600">Start earning commissions by promoting the world's leading SEO platform</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border max-w-2xl mx-auto p-8">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">You're Almost Ready!</h2>
              <p className="text-gray-600">
                Click below to activate your affiliate account and start earning 20% recurring commissions
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 mb-6">
              <div className="text-center">
                <span className="text-2xl mb-2 block">💰</span>
                <h4 className="font-semibold">20% Commission</h4>
                <p className="text-sm text-gray-600">Starting rate</p>
              </div>
              <div className="text-center">
                <span className="text-2xl mb-2 block">⏰</span>
                <h4 className="font-semibold">30-Day Tracking</h4>
                <p className="text-sm text-gray-600">Cookie duration</p>
              </div>
              <div className="text-center">
                <span className="text-2xl mb-2 block">📊</span>
                <h4 className="font-semibold">Real-Time Stats</h4>
                <p className="text-sm text-gray-600">Live dashboard</p>
              </div>
            </div>

            <button 
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              onClick={joinProgram}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <span className="inline-block animate-spin mr-2">⭐</span>
                  Activating Account...
                </>
              ) : (
                <>
                  Activate My Affiliate Account ✓
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              No approval required • Instant activation • Start earning immediately
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Affiliate Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-blue-600 text-xl">∞</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Affiliate Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user.email?.split('@')[0]}! 👋</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <div className="text-sm text-gray-500">User ID</div>
                <div className="text-xs font-mono text-gray-700">{user.id.slice(-8)}</div>
              </div>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
                🥉 Bronze Affiliate
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
                ✓ Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner for New Affiliates */}
      {affiliateData.total_earnings === 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">🎉 Welcome to the Affiliate Program!</h2>
                <p className="text-green-100">
                  Your account is active and ready to earn commissions. Your unique affiliate links are tied to User ID: {user.id.slice(-8)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${affiliateData.total_earnings.toFixed(2)}</div>
                <div className="text-green-100 text-sm">Total Earnings</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold">${affiliateData.total_earnings.toFixed(2)}</p>
                <p className="text-sm text-green-600">+$0.00 this month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-green-600 text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-blue-600">+0 today</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-blue-600 text-xl">👆</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-purple-600">0% rate</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-purple-600 text-xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commission Rate</p>
                <p className="text-2xl font-bold">{(affiliateData.commission_rate * 100).toFixed(0)}%</p>
                <p className="text-sm text-orange-600">Bronze tier</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-orange-600 text-xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Links */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">🔗 Your Referral Links</h2>
          <p className="text-gray-600 mb-6">Use these links to promote Backlinkoo and earn commissions</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Homepage Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={affiliateData.referral_url}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(affiliateData.referral_url)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  📋 Copy
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/pricing?ref=${affiliateData.affiliate_code}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/pricing?ref=${affiliateData.affiliate_code}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-4">🚀 Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-center">
              <span className="block text-2xl mb-2">📱</span>
              <span className="font-semibold">Share on Social</span>
              <p className="text-sm text-gray-600">Post your referral links</p>
            </button>
            
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 transition-colors text-center">
              <span className="block text-2xl mb-2">📧</span>
              <span className="font-semibold">Email Your List</span>
              <p className="text-sm text-gray-600">Send to subscribers</p>
            </button>
            
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors text-center">
              <span className="block text-2xl mb-2">📊</span>
              <span className="font-semibold">View Analytics</span>
              <p className="text-sm text-gray-600">Track performance</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeAffiliateProgram;
