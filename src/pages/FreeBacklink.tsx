import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FreeBacklinkGenerator } from '@/components/FreeBacklinkGenerator';
import { FreeBacklinkPreview } from '@/components/FreeBacklinkPreview';
import { FreeBacklinkManager } from '@/components/FreeBacklinkManager';
import { FreeBacklinkResult } from '@/services/simpleAIContentEngine';
import { Sparkles, FileText, Settings, Gift } from 'lucide-react';

export function FreeBacklink() {
  const [activeTab, setActiveTab] = useState('generate');
  const [generatedContent, setGeneratedContent] = useState<FreeBacklinkResult | null>(null);

  const handleContentGenerated = (content: FreeBacklinkResult) => {
    setGeneratedContent(content);
    setActiveTab('preview');
  };

  const handleViewPost = (post: FreeBacklinkResult) => {
    setGeneratedContent(post);
    setActiveTab('preview');
  };

  const handleRegenerate = (newContent: FreeBacklinkResult) => {
    setGeneratedContent(newContent);
  };

  const handleDelete = () => {
    setGeneratedContent(null);
    setActiveTab('manage');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-8 w-8 text-purple-600" />
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Free Backlink Generator
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Create high-quality, SEO-optimized blog posts with natural backlinks to your website. 
          <span className="text-purple-600 font-semibold"> 100% free, no signup required!</span>
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>AI-Powered Content</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-purple-500" />
            <span>SEO Optimized</span>
          </div>
          <div className="flex items-center gap-1">
            <Gift className="h-4 w-4 text-purple-500" />
            <span>Completely Free</span>
          </div>
        </div>
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
