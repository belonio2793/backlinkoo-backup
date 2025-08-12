import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  X,
  AlertTriangle,
  Eye,
  ExternalLink,
  MessageSquare,
  Users,
  Clock,
  Shield,
  Target,
  Settings,
  Monitor,
  RefreshCw,
  Filter,
  Search,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FormMap {
  id: string;
  target_id: string;
  form_selector: string;
  action_url?: string;
  method: string;
  fields: Record<string, string>;
  hidden_fields: Record<string, string>;
  submit_selector?: string;
  confidence: number;
  status: 'detected' | 'vetted' | 'flagged' | 'blocked';
  needs_human_review: boolean;
  created_at: string;
  crawler_targets: {
    url: string;
    domain: string;
    page_title?: string;
  };
}

interface BlogPost {
  id: string;
  campaign_id: string;
  form_id: string;
  target_url: string;
  content: string;
  status: 'pending' | 'posted' | 'failed' | 'captcha' | 'moderation' | 'blocked';
  response_data?: any;
  screenshot_url?: string;
  error_message?: string;
  created_at: string;
  blog_campaigns: {
    name: string;
    keyword: string;
  };
}

interface ReviewStats {
  pending_forms: number;
  captcha_posts: number;
  failed_posts: number;
  flagged_domains: number;
  total_reviewed: number;
  approval_rate: number;
}

export function HumanReviewInterface() {
  const [pendingForms, setPendingForms] = useState<FormMap[]>([]);
  const [captchaPosts, setCaptchaPosts] = useState<BlogPost[]>([]);
  const [failedPosts, setFailedPosts] = useState<BlogPost[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    pending_forms: 0,
    captcha_posts: 0,
    failed_posts: 0,
    flagged_domains: 0,
    total_reviewed: 0,
    approval_rate: 0
  });

  const [selectedTab, setSelectedTab] = useState('forms');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState('');
  const [filterConfidence, setFilterConfidence] = useState(0);
  const [selectedForm, setSelectedForm] = useState<FormMap | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadPendingForms(),
        loadCaptchaPosts(),
        loadFailedPosts(),
        loadReviewStats()
      ]);
    } catch (error) {
      console.error('Error loading review data:', error);
      toast.error('Failed to load review data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingForms = async () => {
    try {
      const { data, error } = await supabase
        .from('form_maps')
        .select(`
          *,
          crawler_targets (url, domain, page_title)
        `)
        .eq('needs_human_review', true)
        .order('confidence', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPendingForms(data || []);
    } catch (error) {
      console.error('Error loading pending forms:', error);
    }
  };

  const loadCaptchaPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_campaigns (name, keyword)
        `)
        .eq('status', 'captcha')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setCaptchaPosts(data || []);
    } catch (error) {
      console.error('Error loading CAPTCHA posts:', error);
    }
  };

  const loadFailedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          blog_campaigns (name, keyword)
        `)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setFailedPosts(data || []);
    } catch (error) {
      console.error('Error loading failed posts:', error);
    }
  };

  const loadReviewStats = async () => {
    try {
      // Calculate review statistics
      const [formsResult, postsResult] = await Promise.all([
        supabase.from('form_maps').select('status, needs_human_review'),
        supabase.from('blog_posts').select('status')
      ]);

      const forms = formsResult.data || [];
      const posts = postsResult.data || [];

      const stats = {
        pending_forms: forms.filter(f => f.needs_human_review).length,
        captcha_posts: posts.filter(p => p.status === 'captcha').length,
        failed_posts: posts.filter(p => p.status === 'failed').length,
        flagged_domains: forms.filter(f => f.status === 'flagged').length,
        total_reviewed: forms.filter(f => f.status === 'vetted' || f.status === 'flagged').length,
        approval_rate: 0
      };

      const totalProcessed = stats.total_reviewed;
      const approved = forms.filter(f => f.status === 'vetted').length;
      if (totalProcessed > 0) {
        stats.approval_rate = Math.round((approved / totalProcessed) * 100);
      }

      setReviewStats(stats);
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const approveForm = async (formId: string, notes?: string) => {
    setProcessingId(formId);
    try {
      const { error } = await supabase
        .from('form_maps')
        .update({
          status: 'vetted',
          needs_human_review: false
        })
        .eq('id', formId);

      if (error) throw error;

      // Log review action
      await logReviewAction(formId, 'approved', notes);

      toast.success('Form approved for automated posting');
      await loadReviewData();
    } catch (error) {
      console.error('Error approving form:', error);
      toast.error('Failed to approve form');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectForm = async (formId: string, reason: string) => {
    setProcessingId(formId);
    try {
      const { error } = await supabase
        .from('form_maps')
        .update({
          status: 'flagged',
          needs_human_review: true
        })
        .eq('id', formId);

      if (error) throw error;

      // Log review action
      await logReviewAction(formId, 'rejected', reason);

      toast.success('Form flagged and blocked from posting');
      await loadReviewData();
    } catch (error) {
      console.error('Error rejecting form:', error);
      toast.error('Failed to reject form');
    } finally {
      setProcessingId(null);
    }
  };

  const blockDomain = async (domain: string, reason: string) => {
    try {
      // Mark all forms from this domain as blocked
      const { error } = await supabase
        .from('form_maps')
        .update({ status: 'blocked' })
        .in('target_id', 
          supabase
            .from('crawler_targets')
            .select('id')
            .eq('domain', domain)
        );

      if (error) throw error;

      // Also mark the domain in targets as blocked
      await supabase
        .from('crawler_targets')
        .update({ crawl_status: 'blocked' })
        .eq('domain', domain);

      toast.success(`Domain ${domain} blocked from all future posting`);
      await loadReviewData();
    } catch (error) {
      console.error('Error blocking domain:', error);
      toast.error('Failed to block domain');
    }
  };

  const retryFailedPost = async (postId: string) => {
    setProcessingId(postId);
    try {
      // Reset post status to pending for retry
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'pending',
          error_message: null
        })
        .eq('id', postId);

      if (error) throw error;

      toast.success('Post queued for retry');
      await loadReviewData();
    } catch (error) {
      console.error('Error retrying post:', error);
      toast.error('Failed to retry post');
    } finally {
      setProcessingId(null);
    }
  };

  const logReviewAction = async (itemId: string, action: string, notes?: string) => {
    try {
      await supabase
        .from('review_logs')
        .insert([{
          item_id: itemId,
          action,
          notes,
          reviewed_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging review action:', error);
    }
  };

  const filteredForms = pendingForms.filter(form => {
    const domainMatch = !filterDomain || form.crawler_targets.domain.includes(filterDomain);
    const confidenceMatch = form.confidence >= filterConfidence;
    return domainMatch && confidenceMatch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading review queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Human Review Dashboard
          </CardTitle>
          <CardDescription>
            Review and approve automated discoveries before posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{reviewStats.pending_forms}</div>
              <div className="text-sm text-gray-600">Forms Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{reviewStats.captcha_posts}</div>
              <div className="text-sm text-gray-600">CAPTCHA Hits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{reviewStats.failed_posts}</div>
              <div className="text-sm text-gray-600">Failed Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{reviewStats.flagged_domains}</div>
              <div className="text-sm text-gray-600">Flagged Domains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reviewStats.total_reviewed}</div>
              <div className="text-sm text-gray-600">Total Reviewed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{reviewStats.approval_rate}%</div>
              <div className="text-sm text-gray-600">Approval Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forms">
            Forms Review ({reviewStats.pending_forms})
          </TabsTrigger>
          <TabsTrigger value="captcha">
            CAPTCHA Issues ({reviewStats.captcha_posts})
          </TabsTrigger>
          <TabsTrigger value="failures">
            Failed Posts ({reviewStats.failed_posts})
          </TabsTrigger>
        </TabsList>

        {/* Forms Review Tab */}
        <TabsContent value="forms" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Filter by Domain</Label>
                  <Input
                    placeholder="Enter domain to filter..."
                    value={filterDomain}
                    onChange={(e) => setFilterDomain(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Min Confidence</Label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={filterConfidence}
                    onChange={(e) => setFilterConfidence(parseInt(e.target.value) || 0)}
                  />
                </div>
                <Button variant="outline" onClick={loadReviewData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Forms */}
          {filteredForms.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-gray-600">No forms pending human review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredForms.map((form) => (
                <Card key={form.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold">{form.crawler_targets.domain}</h3>
                          <Badge variant={
                            form.confidence >= 15 ? 'default' :
                            form.confidence >= 12 ? 'secondary' :
                            'outline'
                          }>
                            Confidence: {form.confidence}
                          </Badge>
                          <Badge variant="outline">
                            {form.method}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>URL:</strong> 
                            <a 
                              href={form.crawler_targets.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:underline"
                            >
                              {form.crawler_targets.url}
                              <ExternalLink className="h-3 w-3 ml-1 inline" />
                            </a>
                          </p>
                          <p><strong>Page Title:</strong> {form.crawler_targets.page_title || 'Not available'}</p>
                          <p><strong>Form Selector:</strong> <code className="bg-gray-100 px-1 rounded">{form.form_selector}</code></p>
                          
                          <div>
                            <strong>Detected Fields:</strong>
                            <div className="flex gap-2 mt-1">
                              {Object.entries(form.fields).map(([field, selector]) => (
                                <Badge key={field} variant="outline" className="text-xs">
                                  {field}: {selector}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {Object.keys(form.hidden_fields).length > 0 && (
                            <p>
                              <strong>Hidden Fields:</strong> {Object.keys(form.hidden_fields).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => approveForm(form.id)}
                          disabled={processingId === form.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedForm(form)}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(form.crawler_targets.url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Page
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CAPTCHA Issues Tab */}
        <TabsContent value="captcha" className="space-y-4">
          {captchaPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No CAPTCHA issues</h3>
                <p className="text-gray-600">All posts processed successfully</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {captchaPosts.map((post) => (
                <Card key={post.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold">CAPTCHA Encounter</h3>
                          <Badge variant="outline">
                            {post.blog_campaigns.name}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p><strong>Target URL:</strong> {post.target_url}</p>
                          <p><strong>Campaign:</strong> {post.blog_campaigns.name}</p>
                          <p><strong>Keyword:</strong> {post.blog_campaigns.keyword}</p>
                          <p><strong>Comment:</strong> {post.content}</p>
                          <p><strong>Encountered:</strong> {new Date(post.created_at).toLocaleString()}</p>
                        </div>

                        {post.screenshot_url && (
                          <div className="mt-3">
                            <a 
                              href={post.screenshot_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Monitor className="h-4 w-4" />
                              View Screenshot
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => retryFailedPost(post.id)}
                          disabled={processingId === post.id}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(post.target_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open Site
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Failed Posts Tab */}
        <TabsContent value="failures" className="space-y-4">
          {failedPosts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No failed posts</h3>
                <p className="text-gray-600">All posting attempts successful</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {failedPosts.map((post) => (
                <Card key={post.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold">Failed Post</h3>
                          <Badge variant="outline">
                            {post.blog_campaigns.name}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p><strong>Target URL:</strong> {post.target_url}</p>
                          <p><strong>Error:</strong> {post.error_message || 'Unknown error'}</p>
                          <p><strong>Comment:</strong> {post.content}</p>
                          <p><strong>Failed:</strong> {new Date(post.created_at).toLocaleString()}</p>
                        </div>

                        {post.screenshot_url && (
                          <div className="mt-3">
                            <a 
                              href={post.screenshot_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Monitor className="h-4 w-4" />
                              View Screenshot
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => retryFailedPost(post.id)}
                          disabled={processingId === post.id}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const domain = new URL(post.target_url).hostname;
                            blockDomain(domain, 'Too many failed attempts');
                          }}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          Block Domain
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Form Modal */}
      {selectedForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Form</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting form from: {selectedForm.crawler_targets.domain}
            </p>
            <div>
              <Label>Reason for rejection</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={() => {
                  rejectForm(selectedForm.id, reviewNotes);
                  setSelectedForm(null);
                  setReviewNotes('');
                }}
                disabled={!reviewNotes.trim()}
                className="flex-1"
              >
                Reject Form
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedForm(null);
                  setReviewNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
