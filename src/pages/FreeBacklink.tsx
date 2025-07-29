import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FreeBacklinkGenerator } from '@/components/FreeBacklinkGenerator';
import { FreeBacklinkPreview } from '@/components/FreeBacklinkPreview';
import { FreeBacklinkManager } from '@/components/FreeBacklinkManager';
import { GeneratedContentResult } from '@/services/openAIContentGenerator';
import { APIKeyStatus } from '@/components/APIKeyStatus';
import { Sparkles, FileText, Settings, Gift, Zap, CheckCircle2 } from 'lucide-react';

export function FreeBacklink() {
  const [activeTab, setActiveTab] = useState('generate');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentResult | null>(null);

  const handleContentGenerated = (content: GeneratedContentResult) => {
    setGeneratedContent(content);
    setActiveTab('preview');
  };

  const handleViewPost = (post: GeneratedContentResult) => {
    setGeneratedContent(post);
    setActiveTab('preview');
  };

  const handleRegenerate = (newContent: GeneratedContentResult) => {
    setGeneratedContent(newContent);
  };

  const handleDelete = () => {
    setGeneratedContent(null);
    setActiveTab('manage');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Enhanced Page Header */}
      <div className="text-center space-y-8 mb-12">
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl"></div>
          </div>

          <div className="relative flex items-center justify-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl shadow-2xl">
              <Gift className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent">
                Free Backlink
              </h1>
              <h2 className="text-3xl font-bold text-gray-600 tracking-wide">
                Generator
              </h2>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <p className="text-2xl text-gray-600 leading-relaxed mb-6">
            Create high-quality, SEO-optimized blog posts with natural backlinks to your website using our cutting-edge AI technology.
          </p>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <span className="text-xl font-bold text-green-800">100% Free • No Signup Required • Instant Results</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-purple-100 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-purple-100 rounded-full mb-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-800">AI-Powered Content</span>
              <span className="text-sm text-gray-600 text-center mt-1">Advanced algorithms create engaging content</span>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-blue-100 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-blue-100 rounded-full mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-800">SEO Optimized</span>
              <span className="text-sm text-gray-600 text-center mt-1">Built for search engine visibility</span>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-green-100 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-green-100 rounded-full mb-3">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <span className="font-semibold text-gray-800">Completely Free</span>
              <span className="text-sm text-gray-600 text-center mt-1">No hidden costs or subscriptions</span>
            </div>

            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg border border-orange-100 hover:shadow-xl transition-shadow">
              <div className="p-3 bg-orange-100 rounded-full mb-3">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <span className="font-semibold text-gray-800">Instant Results</span>
              <span className="text-sm text-gray-600 text-center mt-1">Get your blog post in minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Status */}
      <div className="mb-6">
        <APIKeyStatus />
      </div>

      {/* Main Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="generate" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Sparkles className="h-4 w-4" />
            Generate Free Backlink
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            Preview & Edit
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4" />
            Manage Posts
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <FreeBacklinkGenerator onContentGenerated={handleContentGenerated} />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <FreeBacklinkPreview 
            content={generatedContent}
            onRegenerate={handleRegenerate}
            onDelete={handleDelete}
          />
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          <FreeBacklinkManager onViewPost={handleViewPost} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
