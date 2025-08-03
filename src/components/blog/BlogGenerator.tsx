import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedBlogForm } from './EnhancedBlogForm';
import { BlogPreview } from './BlogPreview';
import { BlogManager } from './BlogManager';
import { BlogTemplate } from './BlogTemplate';
import { Sparkles, FileText, Settings, BarChart3 } from 'lucide-react';

export function BlogGenerator() {
  const [activeTab, setActiveTab] = useState('generate');
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">AI Blog Generator</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Generate SEO-optimized blog posts with AI, create backlinks, and boost your domain authority
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate SEO-Optimized Blog Post</CardTitle>
              <CardDescription>
                Enter a target URL and keywords to generate high-quality content with automatic backlink creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlogForm onContentGenerated={setGeneratedContent} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <BlogPreview content={generatedContent} />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <BlogManager />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <BlogTemplate />
        </TabsContent>
      </Tabs>
    </div>
  );
}
