import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogForm } from '@/components/blog/BlogForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BlogCreation() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleContentGenerated = (result: any) => {
    setIsGenerating(false);
    if (result.success && result.metadata?.slug) {
      // Navigate to the generated blog post
      navigate(`/blog/${result.metadata.slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/blog')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">AI Blog Generator</h1>
              </div>
              <p className="text-xl text-gray-600 mb-2">
                Create high-quality blog content in seconds
              </p>
              <p className="text-gray-500">
                Generate SEO-optimized blog posts with natural backlinks using AI
              </p>
            </div>
          </div>

          {/* How it works */}
          <Card className="mb-8 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Enter Details</h3>
                  <p className="text-sm text-gray-600">
                    Provide your keyword, anchor text, and target URL
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">AI Generation</h3>
                  <p className="text-sm text-gray-600">
                    Our AI creates a 1000-word blog post with natural backlinks
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Instant Publish</h3>
                  <p className="text-sm text-gray-600">
                    Your post is immediately published and ready to share
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blog Form */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-1">
            <BlogForm 
              onContentGenerated={handleContentGenerated}
            />
          </div>

          {/* Features */}
          <Card className="mt-8 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-sm">SEO Optimized</h4>
                    <p className="text-xs text-gray-600">Content optimized for search engines</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-sm">Natural Backlinks</h4>
                    <p className="text-xs text-gray-600">Contextually relevant link placement</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-sm">Instant Publishing</h4>
                    <p className="text-xs text-gray-600">Posts go live immediately</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-sm">Claiming System</h4>
                    <p className="text-xs text-gray-600">Claim posts to keep them permanently</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <div className="mt-8 text-center text-sm text-gray-600">
            <p>
              Generated posts are trial posts that expire in 24 hours unless claimed. 
              Users can claim up to 3 posts permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
