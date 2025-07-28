/**
 * Blog Template Component - DEPRECATED
 * Redirects users to the AI Live Blog Generator for fresh content
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { 
  Brain,
  Zap,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export function BlogTemplate() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Deprecation Notice */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Blog Templates are Deprecated:</strong> This system has been replaced with fresh AI content generation to ensure all published content is unique and high-quality.
        </AlertDescription>
      </Alert>

      {/* AI Live Redirect */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Brain className="h-6 w-6" />
            Fresh AI Content Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-blue-800">
              All blog content is now generated fresh using advanced AI technology. This ensures every post is unique, 
              high-quality, and tailored to your specific requirements.
            </p>
            
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">✨ Benefits of AI Live Generation:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Fresh, unique content every time</li>
                <li>• SEO-optimized with proper structure</li>
                <li>• 1000+ words of high-quality content</li>
                <li>• Natural anchor text integration</li>
                <li>• Real-time generation with progress tracking</li>
                <li>• Multiple AI providers for reliability</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/ai-live')}
                className="flex-1"
                size="lg"
              >
                <Zap className="mr-2 h-4 w-4" />
                Generate Fresh AI Content
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Old Template System Warning */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-900">
            Why We Removed Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-amber-800 space-y-2">
            <p>
              <strong>Template-based content leads to:</strong>
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Duplicate or similar content across the web</li>
              <li>• Lower SEO rankings due to lack of uniqueness</li>
              <li>• Generic content that doesn't engage readers</li>
              <li>• Predictable structure that feels automated</li>
            </ul>
            
            <p className="mt-4">
              <strong>Fresh AI generation ensures:</strong> Every piece of content is unique, engaging, 
              and optimized for both search engines and human readers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
