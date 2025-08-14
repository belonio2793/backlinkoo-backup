import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { liveCampaignManager } from '@/services/liveCampaignManager';
import { toast } from 'sonner';
import { Zap, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export function PlatformErrorSimulator() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    platform: string;
    success: boolean;
    message: string;
    timestamp: string;
  }>>([]);

  const simulateErrorScenarios = async () => {
    if (!user) {
      toast.error('Please sign in to test platform error handling');
      return;
    }

    setTesting(true);
    setTestResults([]);

    try {
      console.log('🧪 Starting platform error simulation test...');

      // Test scenario: Create a campaign that will exercise platform rotation
      const testParams = {
        name: `Error Simulation Test (${new Date().toISOString().slice(0, 16)})`,
        keywords: ['platform test', 'error handling', 'resilience test'],
        anchor_texts: ['test link', 'error simulation', 'platform rotation'],
        target_url: 'https://example.com/error-simulation-test',
        user_id: user.id,
        auto_start: true // Auto-start to immediately begin platform rotation
      };

      console.log('🔍 Creating test campaign with auto-start:', testParams);

      const result = await liveCampaignManager.createCampaign(testParams);
      
      if (result.success && result.campaign) {
        setTestResults(prev => [...prev, {
          platform: 'Campaign Creation',
          success: true,
          message: `Test campaign created successfully! Campaign will now attempt platform rotation. ID: ${result.campaign.id}`,
          timestamp: new Date().toISOString()
        }]);
        
        toast.success('✅ Error simulation test started! Watch platform health monitor for real-time results.');

        // Monitor for a short period to show initial results
        setTimeout(() => {
          const healthStatus = liveCampaignManager.getPlatformHealthStatus();
          
          healthStatus.forEach(platform => {
            const hasRecentActivity = platform.total_attempts > 0;
            if (hasRecentActivity) {
              setTestResults(prev => [...prev, {
                platform: platform.domain,
                success: platform.consecutive_failures === 0,
                message: `Platform ${platform.domain}: ${platform.total_successes}/${platform.total_attempts} success rate: ${platform.success_rate.toFixed(1)}%`,
                timestamp: new Date().toISOString()
              }]);
            }
          });
        }, 10000); // Check after 10 seconds

      } else {
        setTestResults(prev => [...prev, {
          platform: 'Campaign Creation',
          success: false,
          message: result.error || 'Failed to create test campaign',
          timestamp: new Date().toISOString()
        }]);
        toast.error('❌ Failed to create test campaign');
      }
    } catch (error) {
      console.error('❌ Platform error simulation failed:', error);
      setTestResults(prev => [...prev, {
        platform: 'Test Framework',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }]);
      toast.error('❌ Platform error simulation failed');
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Platform Error Simulation
        </CardTitle>
        <CardDescription>
          Test platform error handling and skipping mechanism by creating a real campaign with auto-start
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Please sign in to test platform error handling</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                This will create a real campaign that attempts to publish to all platforms, allowing you to observe error handling in action
              </div>
              <div className="flex gap-2">
                {testResults.length > 0 && (
                  <Button 
                    onClick={clearResults}
                    variant="outline"
                    size="sm"
                  >
                    Clear Results
                  </Button>
                )}
                <Button 
                  onClick={simulateErrorScenarios}
                  disabled={testing}
                  className="flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Start Error Simulation
                    </>
                  )}
                </Button>
              </div>
            </div>

            {testResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Test Results:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-sm ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {result.platform}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(result.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-700">
                        {result.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1 border-t pt-4">
              <p><strong>What this test does:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Creates a real campaign with auto-start enabled</li>
                <li>Campaign immediately begins platform rotation and content generation</li>
                <li>Each platform attempt is tracked in the Platform Health Monitor</li>
                <li>Failed platforms will be marked as degraded/unhealthy and skipped</li>
                <li>Success/failure metrics are updated in real-time</li>
                <li>Monitor the "Platform Health Monitor" component above for live updates</li>
              </ul>
              <p className="mt-2"><strong>Expected Behavior:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Telegraph.ph should have high success rate (if working)</li>
                <li>Other platforms may fail and be placed in cooldown</li>
                <li>Campaign will skip unhealthy platforms and retry working ones</li>
                <li>Health status will update based on success/failure patterns</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
