import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleBlogForm } from '@/components/blog/SimpleBlogForm';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Sparkles, Zap, TrendingUp, Globe, CheckCircle2 } from 'lucide-react';

export function BlogCreator() {
  const navigate = useNavigate();
  const [generatedPost, setGeneratedPost] = useState<any>(null);

  const handleContentGenerated = (blogPost: any) => {
    setGeneratedPost(blogPost);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/blog')}
              >
                View All Posts
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Create Your
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {" "}Blog Post
                </span>
              </h1>
              <p className="text-xl md:text-2xl font-medium text-blue-100 max-w-3xl mx-auto leading-relaxed">
                Generate high-quality, SEO-optimized content with contextual backlinks in seconds
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="text-center space-y-2">
                <Sparkles className="h-8 w-8 text-yellow-400 mx-auto" />
                <h3 className="font-semibold">AI-Generated</h3>
                <p className="text-sm text-blue-200">Advanced AI creates unique, engaging content</p>
              </div>
              <div className="text-center space-y-2">
                <TrendingUp className="h-8 w-8 text-green-400 mx-auto" />
                <h3 className="font-semibold">SEO Optimized</h3>
                <p className="text-sm text-blue-200">Built for search engine visibility</p>
              </div>
              <div className="text-center space-y-2">
                <Globe className="h-8 w-8 text-blue-400 mx-auto" />
                <h3 className="font-semibold">Instant Publishing</h3>
                <p className="text-sm text-blue-200">Live on the web immediately</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        {!generatedPost ? (
          <div className="space-y-12">
            {/* Form Section */}
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Generate Your Blog Post
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Simply provide your keyword, anchor text, and target URL. Our AI will create a 1000-word blog post with your backlink naturally integrated.
              </p>
            </div>

            <SimpleBlogForm onContentGenerated={handleContentGenerated} />

            {/* How It Works */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center text-2xl">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold">Enter Details</h3>
                    <p className="text-sm text-gray-600">Provide your keyword, anchor text, and target URL</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-purple-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold">AI Generation</h3>
                    <p className="text-sm text-gray-600">Our AI creates a unique 1000-word blog post</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-green-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold">Instant Publish</h3>
                    <p className="text-sm text-gray-600">Post goes live immediately on /blog</p>
                  </div>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-yellow-600 font-bold">4</span>
                    </div>
                    <h3 className="font-semibold">Claim or Wait</h3>
                    <p className="text-sm text-gray-600">Claim within 24 hours or post auto-deletes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Why Choose Our Blog Generator?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">High-Quality Content</h4>
                        <p className="text-sm text-gray-600">AI-generated posts are engaging, informative, and well-structured</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Natural Backlinks</h4>
                        <p className="text-sm text-gray-600">Your anchor text is seamlessly integrated within the content</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">SEO Optimized</h4>
                        <p className="text-sm text-gray-600">Built-in SEO best practices for better search rankings</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Instant Results</h4>
                        <p className="text-sm text-gray-600">Your blog post goes live immediately after generation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Risk-Free Trial</h4>
                        <p className="text-sm text-gray-600">Test with unlimited unclaimed posts before claiming</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Claim System</h4>
                        <p className="text-sm text-gray-600">Up to 3 permanent claimed posts per user</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Success State */
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Blog Post Created Successfully!
              </h2>
              <p className="text-lg text-gray-600">
                Your blog post "{generatedPost.title}" is now live and can be viewed by anyone.
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="text-left space-y-2">
                  <h3 className="font-semibold">Post Details:</h3>
                  <p><strong>Title:</strong> {generatedPost.title}</p>
                  <p><strong>URL:</strong> /blog/{generatedPost.slug}</p>
                  <p><strong>Expires:</strong> {new Date(generatedPost.expiresAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate(`/blog/${generatedPost.slug}`)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Zap className="mr-2 h-5 w-5" />
                View Your Post
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setGeneratedPost(null);
                }}
              >
                Create Another Post
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/blog')}
              >
                Browse All Posts
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
