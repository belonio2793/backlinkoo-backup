import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckSquare,
  XSquare,
  ExternalLink,
  Globe,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingPost {
  id: string;
  campaign_id: string;
  candidate_url: string;
  comment_text: string;
  anchor_text: string;
  indexed_status: string;
  created_at: string;
}

interface PendingPostsModerationProps {
  campaignId?: string;
  onPostApproved?: (post: PendingPost) => void;
  onPostRejected?: (post: PendingPost) => void;
}

export function PendingPostsModeration({ 
  campaignId, 
  onPostApproved, 
  onPostRejected 
}: PendingPostsModerationProps) {
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchPendingPosts = async () => {
    try {
      let query = supabase
        .from('backlinks')
        .select('*')
        .is('posted_at', null)
        .eq('indexed_status', 'pending');
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;
      
      setPendingPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching pending posts:', error);
      toast.error('Failed to load pending posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPosts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('pending-posts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'backlinks',
        filter: campaignId ? `campaign_id=eq.${campaignId}` : undefined
      }, (payload) => {
        fetchPendingPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const approvePost = async (post: PendingPost) => {
    if (processingIds.has(post.id)) return;
    
    setProcessingIds(prev => new Set(prev).add(post.id));
    
    try {
      // Get campaign details to extract keyword
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('keyword')
        .eq('id', post.campaign_id)
        .single();

      if (campaignError) throw campaignError;

      // Call the enqueue function
      const response = await fetch('/.netlify/functions/enqueuePostComment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_id: post.campaign_id,
          candidate_url: post.candidate_url,
          anchor_text: post.anchor_text,
          keyword: campaign.keyword,
          name: 'Blog Commenter',
          email: 'noreply@example.com'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve post');
      }

      toast.success('Post approved and queued for submission');
      
      if (onPostApproved) {
        onPostApproved(post);
      }
      
      await fetchPendingPosts();
    } catch (error: any) {
      console.error('Error approving post:', error);
      toast.error(error.message || 'Failed to approve post');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  };

  const rejectPost = async (post: PendingPost) => {
    if (processingIds.has(post.id)) return;
    
    setProcessingIds(prev => new Set(prev).add(post.id));
    
    try {
      const { error } = await supabase
        .from('backlinks')
        .update({ indexed_status: 'failed' })
        .eq('id', post.id);

      if (error) throw error;

      // Log the rejection
      await supabase.from('campaign_logs').insert([{
        campaign_id: post.campaign_id,
        level: 'info',
        message: `Post rejected by moderator for ${post.candidate_url}`,
        meta: { candidate_url: post.candidate_url, reason: 'manual_rejection' }
      }]);

      toast.success('Post rejected');
      
      if (onPostRejected) {
        onPostRejected(post);
      }
      
      await fetchPendingPosts();
    } catch (error: any) {
      console.error('Error rejecting post:', error);
      toast.error('Failed to reject post');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Loading pending posts...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          <div>
            <CardTitle>Pending Posts Moderation</CardTitle>
            <CardDescription>
              Review and approve generated comments before posting ({pendingPosts.length} pending)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pendingPosts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No pending posts</h3>
            <p className="text-gray-600">Generated comments will appear here for approval</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingPosts.map((post) => (
              <Card key={post.id} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* URL and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <a 
                            href={post.candidate_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium text-sm"
                          >
                            {post.candidate_url}
                          </a>
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Anchor:</strong> {post.anchor_text || 'None'}
                          </div>
                          <div>
                            <strong>Created:</strong> {new Date(post.created_at).toLocaleDateString()}
                          </div>
                          <Badge variant="secondary">
                            {post.indexed_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {/* Generated Comment */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-blue-900">Generated Comment:</h4>
                      </div>
                      <p className="text-gray-700 italic">"{post.comment_text}"</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectPost(post)}
                        disabled={processingIds.has(post.id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <XSquare className="h-4 w-4 mr-2" />
                        {processingIds.has(post.id) ? 'Rejecting...' : 'Reject'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approvePost(post)}
                        disabled={processingIds.has(post.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        {processingIds.has(post.id) ? 'Approving...' : 'Approve & Post'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {pendingPosts.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Moderation Guidelines:</strong> Review each comment for relevance and quality. 
                Ensure comments are appropriate for the target blog and add value to the conversation.
                Rejected posts will be marked as failed and won't be reprocessed.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PendingPostsModeration;
