import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { PremiumService } from '@/services/premiumService';
import { CheckCircle, XCircle, Loader2, Crown } from 'lucide-react';

export function PremiumFeatureTest() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: boolean }>({});
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    if (!user) {
      setTestResults([{ test: 'User Auth', status: 'failed', message: 'No user logged in' }]);
      return;
    }

    setTesting(true);
    const results = [];

    try {
      // Test 1: Check premium status
      const premiumStatus = await PremiumService.checkPremiumStatus(user.id);
      results.push({
        test: 'Premium Status Check',
        status: 'passed',
        message: `Premium status: ${premiumStatus ? 'Active' : 'Inactive'}`
      });
      setIsPremium(premiumStatus);

      // Test 2: Get user progress
      const userProgress = await PremiumService.getUserProgress(user.id);
      results.push({
        test: 'User Progress Fetch',
        status: 'passed',
        message: `Found ${Object.keys(userProgress).length} progress records`
      });
      setProgress(userProgress);

      // Test 3: Test lesson progress update
      const lessonUpdateResult = await PremiumService.updateLessonProgress(
        user.id,
        'test-lesson-id',
        'fundamentals',
        true,
        300
      );
      results.push({
        test: 'Lesson Progress Update',
        status: lessonUpdateResult ? 'passed' : 'failed',
        message: lessonUpdateResult ? 'Successfully updated progress' : 'Failed to update progress'
      });

      // Test 4: Get certificates
      const certificates = await PremiumService.getUserCertificates(user.id);
      results.push({
        test: 'Certificates Fetch',
        status: 'passed',
        message: `Found ${certificates.length} certificates`
      });

      // Test 5: Create test subscription (if not premium)
      if (!premiumStatus) {
        const newSubscription = await PremiumService.createSubscription(
          user.id,
          new Date().toISOString(),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        );
        results.push({
          test: 'Create Test Subscription',
          status: newSubscription ? 'passed' : 'failed',
          message: newSubscription ? 'Test subscription created' : 'Failed to create subscription'
        });
      }

    } catch (error: any) {
      results.push({
        test: 'Overall Test Suite',
        status: 'failed',
        message: `Error: ${error.message}`
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Premium Features Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Test premium feature functionality and database connectivity
            </p>
            {user && (
              <p className="text-xs text-gray-500">
                Testing with user: {user.email}
              </p>
            )}
          </div>
          <Button onClick={runTests} disabled={testing || !user}>
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Tests'
            )}
          </Button>
        </div>

        {/* Current Status */}
        {isPremium !== null && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={isPremium ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {isPremium ? 'Premium Active' : 'Free User'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Progress entries: {Object.keys(progress).length}
            </p>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                {result.status === 'passed' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <div className="flex-1">
                  <span className="font-medium text-sm">{result.test}</span>
                  <p className="text-xs text-gray-600">{result.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!user && (
          <div className="text-center py-4 text-gray-500">
            Please log in to test premium features
          </div>
        )}
      </CardContent>
    </Card>
  );
}
