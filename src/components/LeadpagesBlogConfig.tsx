/**
 * Blog Configuration for leadpages.org Domain
 * Provides a simple blog theme setup for the leadpages.org domain alias
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Globe, BookOpen, Settings, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  slug: string;
}

interface LeadpagesBlogConfigProps {
  domain?: string;
}

export function LeadpagesBlogConfig({ domain = 'leadpages.org' }: LeadpagesBlogConfigProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [themeConfig, setThemeConfig] = useState({
    name: 'minimal-clean',
    title: 'Leadpages Blog',
    description: 'Expert insights on marketing, lead generation, and business growth',
    primaryColor: '#2563eb',
    accentColor: '#7c3aed',
    layout: 'grid'
  });

  useEffect(() => {
    // Simulate loading blog posts
    setTimeout(() => {
      setPosts([
        {
          id: '1',
          title: 'Getting Started with Lead Generation',
          excerpt: 'Learn the fundamentals of generating high-quality leads for your business.',
          publishedAt: new Date().toISOString(),
          author: 'Marketing Team',
          slug: 'getting-started-lead-generation'
        },
        {
          id: '2',
          title: 'Landing Page Best Practices',
          excerpt: 'Discover proven strategies to create high-converting landing pages.',
          publishedAt: new Date(Date.now() - 86400000).toISOString(),
          author: 'Design Team',
          slug: 'landing-page-best-practices'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const previewBlogPage = () => {
    toast.info('Opening blog preview for leadpages.org...');
    
    // In a real implementation, this would open a preview of the blog
    // For now, we'll show what the blog structure would look like
    const blogStructure = {
      url: `https://${domain}/blog`,
      theme: themeConfig.name,
      layout: themeConfig.layout,
      posts: posts.length,
      features: [
        'Responsive design',
        'SEO optimized',
        'Fast loading',
        'Social sharing',
        'Email subscription'
      ]
    };
    
    console.log('📝 Blog Preview Configuration:', blogStructure);
    alert(`Blog would be available at: https://${domain}/blog\n\nTheme: ${themeConfig.name}\nPosts: ${posts.length}\nFeatures: ${blogStructure.features.join(', ')}`);
  };

  const updateThemeSettings = () => {
    toast.success('Theme settings updated for leadpages.org blog');
  };

  return (
    <div className="space-y-6">
      {/* Domain Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {domain} Blog Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Domain Status</h3>
                <p className="text-sm text-gray-600">leadpages.org configured as Netlify alias</p>
              </div>
              <Badge variant="default" className="bg-green-600">
                Alias Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Blog URL</h3>
                <p className="text-sm text-gray-600">https://{domain}/blog</p>
              </div>
              <Badge variant="outline">
                Ready
              </Badge>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your domain {domain} is configured as an alias to your main Netlify site. 
                Visitors to {domain} will see your blog content while preserving your primary domain.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Blog Theme Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Blog Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Blog Title</label>
                <input
                  type="text"
                  value={themeConfig.title}
                  onChange={(e) => setThemeConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Theme</label>
                <select
                  value={themeConfig.name}
                  onChange={(e) => setThemeConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="minimal-clean">Minimal Clean</option>
                  <option value="modern-business">Modern Business</option>
                  <option value="elegant-editorial">Elegant Editorial</option>
                  <option value="tech-focus">Tech Focus</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={themeConfig.description}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, description: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                rows={2}
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={updateThemeSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Save Theme Settings
              </Button>
              <Button variant="outline" onClick={previewBlogPage}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Blog
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Blog Posts ({posts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No blog posts yet. Start creating content for your leadpages.org blog!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-medium text-lg mb-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>By {post.author}</span>
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      /{post.slug}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>DNS Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              To complete the setup for {domain}, configure these DNS records:
            </p>
            <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
              <div>Type: A</div>
              <div>Name: @</div>
              <div>Value: 75.2.60.5</div>
              <div>TTL: 3600</div>
            </div>
            <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
              <div>Type: CNAME</div>
              <div>Name: www</div>
              <div>Value: your-site.netlify.app</div>
              <div>TTL: 3600</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LeadpagesBlogConfig;
