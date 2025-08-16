/**
 * Blog Typo Fix Component
 * 
 * Admin component to find and fix typos in blog posts,
 * specifically targeting the "Faceook" to "Facebook" correction.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BlogTitleService } from '@/services/blogTitleService';
import { blogService } from '@/services/blogService';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  FileText,
  Edit,
  Zap
} from 'lucide-react';

interface TypoPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  typos: Array<{
    field: string;
    original: string;
    corrected: string;
  }>;
}

export function BlogTypoFix() {
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [typoePosts, setTypoPosts] = useState<TypoPost[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const { toast } = useToast();

  const scanForTypos = async () => {
    setIsScanning(true);
    setScanComplete(false);
    setTypoPosts([]);

    try {
      // Get all blog posts
      const blogServiceInstance = new blogService();
      const { data: posts, error } = await blogServiceInstance.getBlogPosts({});

      if (error) {
        toast({
          title: "Scan Failed",
          description: "Failed to fetch blog posts for scanning.",
          variant: "destructive"
        });
        return;
      }

      if (!posts || posts.length === 0) {
        toast({
          title: "No Posts Found",
          description: "No blog posts found to scan.",
        });
        setScanComplete(true);
        return;
      }

      console.log(`📊 Scanning ${posts.length} blog posts for typos...`);

      const postsWithTypos: TypoPost[] = [];

      for (const post of posts) {
        const typos: Array<{ field: string; original: string; corrected: string }> = [];

        // Check title
        if (post.title && post.title.includes('Faceook')) {
          typos.push({
            field: 'title',
            original: post.title,
            corrected: post.title.replace(/Faceook/g, 'Facebook')
          });
        }

        // Check content
        if (post.content && post.content.includes('Faceook')) {
          typos.push({
            field: 'content',
            original: 'Content contains "Faceook"',
            corrected: 'Will be replaced with "Facebook"'
          });
        }

        // Check meta description
        if (post.meta_description && post.meta_description.includes('Faceook')) {
          typos.push({
            field: 'meta_description',
            original: post.meta_description,
            corrected: post.meta_description.replace(/Faceook/g, 'Facebook')
          });
        }

        // Check keywords
        if (post.keywords && post.keywords.some((k: string) => k.includes('Faceook'))) {
          typos.push({
            field: 'keywords',
            original: post.keywords.filter((k: string) => k.includes('Faceook')).join(', '),
            corrected: post.keywords.map((k: string) => k.replace(/Faceook/g, 'Facebook')).join(', ')
          });
        }

        if (typos.length > 0) {
          postsWithTypos.push({
            id: post.id,
            title: post.title || 'Untitled',
            slug: post.slug || '',
            content: post.content || '',
            typos
          });
        }
      }

      setTypoPosts(postsWithTypos);
      setScanComplete(true);

      toast({
        title: "Scan Complete",
        description: `Found ${postsWithTypos.length} post(s) with typos in ${posts.length} total posts.`,
      });

    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Error",
        description: "An error occurred while scanning for typos.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const fixSinglePost = async (post: TypoPost) => {
    try {
      console.log(`🔧 Fixing typos in post: ${post.title}`);

      const blogServiceInstance = new blogService();
      
      // Get the current post data
      const { data: currentPost, error: fetchError } = await blogServiceInstance.getBlogPost(post.id);
      
      if (fetchError || !currentPost) {
        throw new Error(`Failed to fetch post: ${fetchError?.message || 'Post not found'}`);
      }

      // Prepare corrected data
      const correctedData: any = {
        updated_at: new Date().toISOString()
      };

      let hasChanges = false;

      // Fix title
      if (currentPost.title && currentPost.title.includes('Faceook')) {
        correctedData.title = currentPost.title.replace(/Faceook/g, 'Facebook');
        hasChanges = true;
      }

      // Fix content
      if (currentPost.content && currentPost.content.includes('Faceook')) {
        correctedData.content = currentPost.content.replace(/Faceook/g, 'Facebook');
        hasChanges = true;
      }

      // Fix meta description
      if (currentPost.meta_description && currentPost.meta_description.includes('Faceook')) {
        correctedData.meta_description = currentPost.meta_description.replace(/Faceook/g, 'Facebook');
        hasChanges = true;
      }

      // Fix keywords
      if (currentPost.keywords && currentPost.keywords.some((k: string) => k.includes('Faceook'))) {
        correctedData.keywords = currentPost.keywords.map((k: string) => k.replace(/Faceook/g, 'Facebook'));
        hasChanges = true;
      }

      // Generate new slug if title changed
      if (correctedData.title) {
        correctedData.slug = generateSlug(correctedData.title);
        hasChanges = true;
      }

      if (!hasChanges) {
        console.log('No changes needed for this post');
        return { success: true, message: 'No changes needed' };
      }

      // Update the post
      const { error: updateError } = await blogServiceInstance.updateBlogPost(post.id, correctedData);

      if (updateError) {
        throw new Error(`Failed to update post: ${updateError.message}`);
      }

      console.log('✅ Post updated successfully');
      return { 
        success: true, 
        message: 'Post corrected successfully',
        corrections: Object.keys(correctedData).filter(k => k !== 'updated_at')
      };

    } catch (error) {
      console.error('Fix error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const fixAllTypos = async () => {
    if (typoePosts.length === 0) return;

    setIsFixing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const post of typoePosts) {
        const result = await fixSinglePost(post);
        
        if (result.success) {
          successCount++;
          console.log(`✅ Fixed: ${post.title}`);
        } else {
          failCount++;
          console.error(`❌ Failed: ${post.title} - ${result.message}`);
        }
      }

      // Refresh the scan after fixing
      if (successCount > 0) {
        await scanForTypos();
      }

      toast({
        title: "Typo Fix Complete",
        description: `Successfully fixed ${successCount} post(s). ${failCount > 0 ? `${failCount} failed.` : ''}`,
      });

    } catch (error) {
      toast({
        title: "Fix Error",
        description: "An error occurred while fixing typos.",
        variant: "destructive"
      });
    } finally {
      setIsFixing(false);
    }
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Blog Typo Scanner & Fixer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This tool will scan all blog posts for the "Faceook" typo and replace it with "Facebook".
              It will update titles, content, meta descriptions, keywords, and generate new slugs as needed.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-3">
            <Button
              onClick={scanForTypos}
              disabled={isScanning || isFixing}
              variant="outline"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scan for Typos
                </>
              )}
            </Button>

            {typoePosts.length > 0 && (
              <Button
                onClick={fixAllTypos}
                disabled={isScanning || isFixing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isFixing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Fix All Typos ({typoePosts.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Scan Results
              </span>
              <Badge variant={typoePosts.length > 0 ? "destructive" : "default"}>
                {typoePosts.length} post(s) with typos
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typoePosts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">All Clean!</h3>
                <p className="text-green-600">No typos found in your blog posts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {typoePosts.map((post) => (
                  <Card key={post.id} className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-red-900">{post.title}</h4>
                            <p className="text-sm text-red-700">Slug: {post.slug}</p>
                          </div>
                          <Badge variant="destructive">
                            {post.typos.length} issue(s)
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {post.typos.map((typo, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-red-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Edit className="h-4 w-4 text-red-600" />
                                <span className="font-medium text-red-800 capitalize">
                                  {typo.field.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Original:</span>
                                  <div className="bg-red-100 p-2 rounded mt-1 font-mono text-xs">
                                    {typo.original.length > 100 
                                      ? typo.original.substring(0, 100) + '...'
                                      : typo.original
                                    }
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Corrected:</span>
                                  <div className="bg-green-100 p-2 rounded mt-1 font-mono text-xs">
                                    {typo.corrected.length > 100 
                                      ? typo.corrected.substring(0, 100) + '...'
                                      : typo.corrected
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
