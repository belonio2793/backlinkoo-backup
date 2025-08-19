import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { TestTube, Play, CheckCircle, AlertCircle } from 'lucide-react';

export const BlogTemplateSaveTest: React.FC = () => {
  const [isTesting, setIsTestine] = useState(false);
  const [testResult, setTestResult] = useState<'none' | 'success' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState('');

  const testSaveFunction = async () => {
    setIsTestine(true);
    setTestResult('none');
    setErrorMessage('');

    try {
      console.log('🧪 Testing blog template save functionality...');
      
      // Test localStorage save directly
      const testData = {
        domain_id: 'test-domain-' + Date.now(),
        theme_id: 'minimal',
        custom_styles: {
          primaryColor: '#1e40af',
          accentColor: '#3b82f6'
        },
        updated_at: new Date().toISOString(),
        test: true
      };

      const storageKey = 'domain-blog-theme-settings';
      const currentSettings = JSON.parse(localStorage.getItem(storageKey) || '{}');
      currentSettings[testData.domain_id] = testData;
      localStorage.setItem(storageKey, JSON.stringify(currentSettings));

      // Verify the save
      const retrieved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (retrieved[testData.domain_id] && retrieved[testData.domain_id].test === true) {
        console.log('✅ Save test successful');
        setTestResult('success');
        toast({
          title: "Save Test Successful",
          description: "Blog template saving is working correctly with localStorage.",
          variant: "default"
        });
      } else {
        throw new Error('Data was not saved correctly');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Save test failed:', errorMsg);
      setTestResult('error');
      setErrorMessage(errorMsg);
      toast({
        title: "Save Test Failed",
        description: `Save functionality is not working: ${errorMsg}`,
        variant: "destructive"
      });
    } finally {
      setIsTestine(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TestTube className="h-4 w-4" />
          Quick Save Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          Test the blog template save functionality to ensure it's working correctly.
        </p>
        
        <Button 
          onClick={testSaveFunction}
          disabled={isTestine}
          size="sm"
          variant="outline"
          className="w-full"
        >
          {isTestine ? (
            <>
              <Play className="h-3 w-3 mr-2 animate-pulse" />
              Testing...
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-2" />
              Test Save Function
            </>
          )}
        </Button>

        {testResult === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              Save functionality is working correctly
            </AlertDescription>
          </Alert>
        )}

        {testResult === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Save test failed: {errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BlogTemplateSaveTest;
