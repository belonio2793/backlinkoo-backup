import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CampaignCreationHelper } from '@/utils/campaignCreationHelper';
import { toast } from 'sonner';

interface TestResult {
  step: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  data?: any;
}

export function CampaignCreationTest() {
  const { user, isAuthenticated } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const updateTestResult = (step: string, status: TestResult['status'], message?: string, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      } else {
        return [...prev, { step, status, message, data }];
      }
    });
  };

  const runCampaignCreationTest = async () => {
    if (!isAuthenticated || !user?.id) {
      toast.error('Please sign in to run campaign tests');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    const testCampaignData = {
      name: 'Test Campaign',
      engine_type: 'blog_comments',
      target_url: 'https://example.com',
      keywords: ['test keyword', 'automation', 'backlinks'],
      anchor_texts: ['test link', 'example site', 'click here'],
      status: 'draft' as const,
      daily_limit: 10,
      auto_start: false
    };

    try {
      // Step 1: Validation Test
      updateTestResult('validation', 'running', 'Testing data validation...');
      const validation = CampaignCreationHelper.validateCampaignData(testCampaignData);
      
      if (validation.isValid) {
        updateTestResult('validation', 'passed', 'Data validation passed', {
          normalizedUrl: validation.normalizedData?.target_url,
          keywordCount: validation.normalizedData?.keywords.length,
          anchorTextCount: validation.normalizedData?.anchor_texts.length
        });
      } else {
        updateTestResult('validation', 'failed', `Validation failed: ${validation.errors.join(', ')}`);
        setIsRunning(false);
        return;
      }

      // Step 2: Unique Identifier Generation
      updateTestResult('uniqueId', 'running', 'Testing unique identifier generation...');
      const uniqueId1 = CampaignCreationHelper.generateUniqueIdentifier('Test Campaign');
      const uniqueId2 = CampaignCreationHelper.generateUniqueIdentifier('Test Campaign');
      
      if (uniqueId1 !== uniqueId2 && uniqueId1.includes('Test Campaign') && uniqueId2.includes('Test Campaign')) {
        updateTestResult('uniqueId', 'passed', 'Unique identifiers generated successfully', {
          id1: uniqueId1,
          id2: uniqueId2,
          areUnique: uniqueId1 !== uniqueId2
        });
      } else {
        updateTestResult('uniqueId', 'failed', 'Unique identifier generation failed');
        setIsRunning(false);
        return;
      }

      // Step 3: Duplicate Check
      updateTestResult('duplicateCheck', 'running', 'Testing duplicate detection...');
      const duplicateCheck = await CampaignCreationHelper.checkForDuplicates(user.id, testCampaignData.target_url);
      updateTestResult('duplicateCheck', 'passed', 'Duplicate check completed', {
        hasDuplicate: duplicateCheck.hasDuplicate,
        existingCampaign: duplicateCheck.existingCampaign?.name || 'None'
      });

      // Step 4: Campaign Creation
      updateTestResult('creation', 'running', 'Creating test campaign...');
      const creationResult = await CampaignCreationHelper.createCampaignWithUniqueId(user.id, testCampaignData);
      
      if (creationResult.success && creationResult.data) {
        updateTestResult('creation', 'passed', 'Campaign created successfully', {
          campaignId: creationResult.campaignId,
          name: creationResult.data.name,
          targetUrl: creationResult.data.target_url,
          keywordsCount: creationResult.data.keywords.length,
          anchorTextsCount: creationResult.data.anchor_texts.length
        });

        // Step 5: Verification
        updateTestResult('verification', 'running', 'Verifying campaign data...');
        const verification = await CampaignCreationHelper.verifyCampaignSaved(creationResult.campaignId!);
        
        if (verification.isValid) {
          updateTestResult('verification', 'passed', 'Campaign verification successful', {
            allFieldsPresent: true,
            urlFormat: verification.details?.target_url?.startsWith('https://'),
            keywordsCount: verification.details?.keywords?.length,
            anchorTextsCount: verification.details?.anchor_texts?.length
          });

          toast.success('All campaign creation tests passed!');
        } else {
          updateTestResult('verification', 'failed', `Verification failed: ${verification.errors?.join(', ')}`);
        }
      } else {
        updateTestResult('creation', 'failed', creationResult.error || 'Unknown creation error');
      }

    } catch (error: any) {
      updateTestResult('error', 'failed', `Test error: ${error.message}`);
      toast.error('Test execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      passed: 'default',
      failed: 'destructive'
    } as const;

    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      running: 'bg-blue-100 text-blue-700',
      passed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Campaign Creation Test Suite
        </CardTitle>
        <CardDescription>
          Test campaign creation with unique identifiers, URL validation, and data integrity checks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            {isAuthenticated ? (
              <p className="text-sm text-green-600">✓ User authenticated: {user?.email}</p>
            ) : (
              <p className="text-sm text-red-600">✗ Please sign in to run tests</p>
            )}
          </div>
          <Button 
            onClick={runCampaignCreationTest}
            disabled={!isAuthenticated || isRunning}
            className="flex items-center gap-2"
          >
            {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRunning ? 'Running Tests...' : 'Run Campaign Tests'}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {testResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium capitalize">{result.step.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  {result.message && (
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  )}
                  
                  {result.data && (
                    <div className="bg-gray-50 rounded p-3 text-xs">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {testResults.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Run Campaign Tests" to start testing campaign creation functionality</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
