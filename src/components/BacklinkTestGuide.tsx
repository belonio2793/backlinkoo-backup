import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info, ExternalLink, Target, Zap } from 'lucide-react';
import { enhancedAIContentEngine } from '@/services/enhancedAIContentEngine';
import { huggingFaceService } from '@/services/api/huggingface';
import { cohereService } from '@/services/api/cohere';

interface ProviderStatus {
  name: string;
  configured: boolean;
  available: boolean;
  tested: boolean;
}

export function BacklinkTestGuide() {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([]);
  const [isTestingProviders, setIsTestingProviders] = useState(false);

  const testAIProviders = async () => {
    setIsTestingProviders(true);
    try {
      console.log('🧪 Testing AI providers connectivity...');
      
      const providers = [
        { name: 'HuggingFace', service: huggingFaceService },
        { name: 'Cohere', service: cohereService }
      ];

      const results: ProviderStatus[] = [];
      
      for (const provider of providers) {
        const configured = provider.service.isConfigured();
        let available = false;
        
        if (configured) {
          try {
            available = await provider.service.testConnection();
          } catch (error) {
            console.warn(`${provider.name} test failed:`, error);
          }
        }
        
        results.push({
          name: provider.name,
          configured,
          available,
          tested: true
        });
      }
      
      setProviderStatus(results);
    } catch (error) {
      console.error('Provider testing failed:', error);
    } finally {
      setIsTestingProviders(false);
    }
  };

  const testExampleContent = async () => {
    const testRequest = {
      keyword: 'SEO optimization',
      targetUrl: 'https://example.com',
      anchorText: 'SEO tools',
      contentLength: 'medium' as const,
      seoFocus: 'high' as const
    };

    try {
      console.log('🚀 Testing content generation...');
      const result = await enhancedAIContentEngine.generateContent(testRequest);
      console.log('✅ Test successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Feature Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            <CardTitle>Backlink Creation Feature Status</CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              ✅ Enhanced & Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">HuggingFace Integration</div>
                <div className="text-sm text-muted-foreground">Added to enhanced AI content engine</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">SEO Content Formatting</div>
                <div className="text-sm text-muted-foreground">Follows strict SEO guidelines</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Anchor Text Integration</div>
                <div className="text-sm text-muted-foreground">Natural backlink placement</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Multi-Provider Support</div>
                <div className="text-sm text-muted-foreground">OpenAI, Grok, Cohere, HuggingFace</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Guidelines Implemented */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            SEO Content Guidelines Implemented
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">✅ Headline Structure</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>One &lt;h1&gt; tag per page (blog post title)</li>
                <li>&lt;h2&gt; for major section headings (3-5 sections)</li>
                <li>&lt;h3&gt; for subpoints under each h2 (5-8 subheadings)</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">✅ Paragraph Structure</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Short paragraphs (2–4 sentences max)</li>
                <li>Line breaks between paragraphs</li>
                <li>No long blocks of text</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">✅ Keyword Optimization</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Main keyword in &lt;h1&gt; tag</li>
                <li>Keyword in first 100 words</li>
                <li>2-4 keyword mentions in body</li>
                <li>Related keywords naturally used</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">✅ Anchor Text & Links</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Natural anchor text (not "click here")</li>
                <li>target="_blank" rel="noopener noreferrer"</li>
                <li>Proper link integration</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">✅ Text Emphasis</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>&lt;strong&gt; for important keywords</li>
                <li>&lt;em&gt; for italic emphasis</li>
                <li>Strategic content formatting</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">✅ Content Quality</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Minimum 1000+ words</li>
                <li>Original content creation</li>
                <li>Mobile-responsive formatting</li>
                <li>Schema markup hints</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider Testing */}
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Connectivity Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-5 w-5 text-blue-600" />
            <div className="text-sm">
              <strong>Note:</strong> The system works with fallback templates even when AI providers are not configured. 
              API keys are optional for testing the basic functionality.
            </div>
          </div>
          
          <Button 
            onClick={testAIProviders} 
            disabled={isTestingProviders}
            className="w-full"
          >
            {isTestingProviders ? 'Testing Providers...' : 'Test AI Provider Connectivity'}
          </Button>
          
          {providerStatus.length > 0 && (
            <div className="space-y-2">
              {providerStatus.map((provider, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{provider.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={provider.configured ? "default" : "secondary"}>
                      {provider.configured ? 'Configured' : 'Not Configured'}
                    </Badge>
                    {provider.configured && (
                      <Badge variant={provider.available ? "default" : "destructive"}>
                        {provider.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How to Test */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test the Backlink Feature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-medium">Navigate to the Homepage</h4>
                <p className="text-sm text-muted-foreground">
                  Go to the main page where the "Create Your First Backlink For Free" section is displayed.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-medium">Fill in the Form</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1 space-y-1">
                  <li><strong>Target URL:</strong> Enter any valid URL (e.g., https://example.com)</li>
                  <li><strong>Primary Keyword:</strong> Enter a keyword (e.g., "digital marketing")</li>
                  <li><strong>Anchor Text:</strong> Optional custom anchor text</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-medium">Click "Create Permanent Link"</h4>
                <p className="text-sm text-muted-foreground">
                  The system will generate SEO-optimized content with natural backlink integration.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-medium">Review Generated Content</h4>
                <p className="text-sm text-muted-foreground">
                  Check the preview to see proper SEO formatting, backlink integration, and content quality.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ What to Expect:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• High-quality, SEO-optimized content (1000+ words)</li>
              <li>• Natural backlink integration with proper attributes</li>
              <li>• Proper HTML structure (H1, H2, H3 headings)</li>
              <li>• Short paragraphs and good readability</li>
              <li>• Keyword optimization without stuffing</li>
              <li>• Schema markup hints for better SEO</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Optional: AI API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">For Enhanced AI Generation:</h4>
            <p className="text-sm text-blue-700 mb-3">
              Add these environment variables to enable AI-powered content generation:
            </p>
            <div className="space-y-2 text-sm">
              <div className="font-mono bg-white p-2 rounded border">
                <div>OPENAI_API_KEY=your_openai_key</div>
                <div>GROK_API_KEY=your_grok_key</div>
                <div>COHERE_API_KEY=your_cohere_key</div>
                <div>HUGGINGFACE_TOKEN=your_huggingface_token</div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              💡 Without API keys, the system uses intelligent template generation with excellent results.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>🎉 The backlink creation feature is now fully enhanced and ready for use!</p>
        <p>It integrates HuggingFace, Cohere, and follows all SEO content formatting guidelines.</p>
      </div>
    </div>
  );
}
