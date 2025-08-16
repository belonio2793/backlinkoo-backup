import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function BlogGenerationFixTest() {
  const [isFixing, setIsFixing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [fixResult, setFixResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fixSchemaConstraints = async () => {
    setIsFixing(true);
    setFixResult(null);
    
    try {
      const response = await fetch('/.netlify/functions/fix-blog-constraints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      setFixResult({
        success: result.success,
        message: result.success ? 'Schema constraints fixed successfully!' : result.error
      });
    } catch (error) {
      setFixResult({
        success: false,
        message: `Fix failed: ${error.message}`
      });
    } finally {
      setIsFixing(false);
    }
  };

  const testBlogGeneration = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Test blog generation with minimal data
      const response = await fetch('/.netlify/functions/ai-content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Write a comprehensive blog post about effective digital marketing strategies',
          keyword: 'digital marketing',
          anchor_text: 'Learn Digital Marketing',
          target_url: 'https://example.com/marketing',
          word_count: 500
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult({
          success: true,
          message: 'Blog generation test successful! Content was generated without schema errors.'
        });
      } else {
        setTestResult({
          success: false,
          message: `Blog generation failed: ${result.error}`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Blog Generation Fix Test
          </CardTitle>
          <CardDescription>
            Test and fix the database schema constraints that are causing blog generation errors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Schema Fix Section */}
          <div className="space-y-2">
            <h3 className="font-medium">Step 1: Fix Database Schema</h3>
            <p className="text-sm text-muted-foreground">
              This will modify the published_blog_posts table to allow NULL values for anchor_text and keyword columns.
            </p>
            <Button 
              onClick={fixSchemaConstraints} 
              disabled={isFixing}
              className="w-full"
            >
              {isFixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing Schema...
                </>
              ) : (
                'Fix Schema Constraints'
              )}
            </Button>
            
            {fixResult && (
              <Alert className={fixResult.success ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {fixResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>{fixResult.message}</AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Test Generation Section */}
          <div className="space-y-2">
            <h3 className="font-medium">Step 2: Test Blog Generation</h3>
            <p className="text-sm text-muted-foreground">
              This will test if blog generation works without the constraint violation error.
            </p>
            <Button 
              onClick={testBlogGeneration} 
              disabled={isTesting || !fixResult?.success}
              variant="outline"
              className="w-full"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Generation...
                </>
              ) : (
                'Test Blog Generation'
              )}
            </Button>
            
            {testResult && (
              <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How this fixes the error:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Modifies database schema to allow NULL values for anchor_text and keyword</li>
              <li>• Updates blog service to provide default values when fields are missing</li>
              <li>• Prevents "null value violates not null constraint" errors</li>
              <li>• Maintains backward compatibility with existing code</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
