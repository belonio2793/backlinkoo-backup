/**
 * Demo component to test that error handling fixes are working correctly
 * This component demonstrates proper error handling and can be temporarily added to test
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatErrorForUI } from '@/utils/errorUtils';
import { campaignMetricsService } from '@/services/campaignMetricsService';
import { userService } from '@/services/userService';

export function ErrorFixDemoComponent() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const testCampaignMetricsError = async () => {
    setIsLoading(true);
    try {
      // This should trigger a database error and test our error handling
      const result = await campaignMetricsService.getCampaignMetrics('fake-user-id');
      
      if (!result.success) {
        // Before fix: This would show [object Object]
        // After fix: This should show proper error message
        toast({
          title: "Campaign Metrics Test",
          description: formatErrorForUI(result.error),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Campaign Metrics Test",
          description: "Unexpected success - this was supposed to fail",
        });
      }
    } catch (error) {
      toast({
        title: "Campaign Metrics Test Error",
        description: formatErrorForUI(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testUserServiceError = async () => {
    setIsLoading(true);
    try {
      // This should test userService error handling
      const profile = await userService.getCurrentUserProfile();
      
      if (!profile) {
        toast({
          title: "User Service Test",
          description: "No profile found (this is expected)",
          variant: "default",
        });
      } else {
        toast({
          title: "User Service Test",
          description: `Profile loaded: ${profile.role}`,
        });
      }
    } catch (error) {
      toast({
        title: "User Service Test Error", 
        description: formatErrorForUI(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testErrorFormattingExamples = () => {
    // Test various error types
    const testCases = [
      { name: 'Standard Error', error: new Error('Test error message') },
      { name: 'Supabase Error', error: { message: 'Database error', code: '42P01', hint: 'Check your setup' } },
      { name: 'Plain Object', error: { someField: 'value', nested: { data: 'test' } } },
      { name: 'String Error', error: 'Simple string error' },
      { name: 'Null Error', error: null },
      { name: 'Response-like Object', error: { status: 500, statusText: 'Server Error' } }
    ];

    testCases.forEach((testCase, index) => {
      setTimeout(() => {
        toast({
          title: `Error Format Test: ${testCase.name}`,
          description: formatErrorForUI(testCase.error),
          variant: index % 2 === 0 ? "destructive" : "default",
        });
      }, index * 1000);
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Error Handling Fix Demo</CardTitle>
        <CardDescription>
          Test that error handling fixes are working correctly. 
          Before: errors would show as "[object Object]". 
          After: errors should show readable messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={testCampaignMetricsError}
            disabled={isLoading}
            variant="outline"
          >
            Test Campaign Metrics Error
          </Button>
          
          <Button 
            onClick={testUserServiceError}
            disabled={isLoading}
            variant="outline"
          >
            Test User Service Error
          </Button>
        </div>
        
        <Button 
          onClick={testErrorFormattingExamples}
          disabled={isLoading}
          className="w-full"
        >
          Test All Error Formatting Examples
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Expected behavior:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All error messages should be readable strings</li>
            <li>No "[object Object]" should appear</li>
            <li>Supabase errors should show helpful messages</li>
            <li>Network errors should be properly formatted</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
