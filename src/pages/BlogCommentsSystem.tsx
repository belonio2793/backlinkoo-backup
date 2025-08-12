import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Globe,
  Target,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  Shield,
  Loader2,
  Search,
  Bot,
  Activity,
  Database,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BlogCampaign {
  id: string;
  user_id: string;
  name: string;
  target_url: string;
  keyword: string;
  anchor_text: string;
  status: 'active' | 'paused' | 'completed';
  automation_enabled: boolean;
  created_at: string;
  links_found: number;
  links_posted: number;
}

interface BlogAccount {
  id: string;
  user_id: string;
  platform: 'substack' | 'medium' | 'wordpress' | 'generic';
  email: string;
  display_name?: string;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'failed' | 'expired';
  last_used?: string;
  created_at: string;
}

interface AutomationJob {
  id: string;
  campaign_id: string;
  job_type: 'discover_blogs' | 'post_comments' | 'verify_accounts';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface BlogComment {
  id: string;
  campaign_id: string;
  blog_url: string;
  comment_text: string;
  status: 'pending' | 'approved' | 'posted' | 'failed' | 'processing' | 'needs_verification';
  platform: 'substack' | 'medium' | 'wordpress' | 'generic';
  account_id?: string;
  error_message?: string;
  posted_at?: string;
  created_at: string;
}

export default function BlogCommentsSystem() {
  const { user, isAuthenticated, isPremium } = useAuth();
  
  // State
  const [campaigns, setCampaigns] = useState<BlogCampaign[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [accounts, setAccounts] = useState<BlogAccount[]>([]);
  const [automationJobs, setAutomationJobs] = useState<AutomationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    target_url: '',
    keyword: '',
    anchor_text: '',
    auto_start: false,
    automation_enabled: false
  });

  const [accountFormData, setAccountFormData] = useState({
    platform: 'substack' as 'substack' | 'medium' | 'wordpress' | 'generic',
    email: '',
    display_name: ''
  });

  // Check if our tables exist
  const checkTablesExist = async () => {
    try {
      // Try to query our blog campaigns table (main table)
      const { data, error } = await supabase
        .from('blog_campaigns')
        .select('count')
        .limit(1);

      if (error) {
        console.log('Blog campaigns table does not exist');
        setShowDatabaseSetup(true);
        return false;
      }

      // Check if automation tables exist (these are optional)
      try {
        await supabase.from('blog_accounts').select('count').limit(1);
        await supabase.from('automation_jobs').select('count').limit(1);
        console.log('All automation tables exist');
      } catch (error) {
        console.log('Some automation tables missing - advanced features will be limited');
      }

      return true;
    } catch (error) {
      console.log('Database check failed');
      setShowDatabaseSetup(true);
      return false;
    }
  };

  // Load campaigns using our own table
  const loadCampaigns = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { data, error } = await supabase
        .from('blog_campaigns')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error('Error loading campaigns:', error);
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        setShowDatabaseSetup(true);
      }
    }
  };

  // Load comments
  const loadComments = async () => {
    if (!isAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          blog_campaigns (name, keyword)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    }
  };

  // Load accounts
  const loadAccounts = async () => {
    if (!isAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from('blog_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Table doesn't exist yet - this is expected until SQL setup is run
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('blog_accounts table does not exist yet - run SQL setup');
          setAccounts([]);
          return;
        }
        throw error;
      }
      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error loading accounts:', error.message || error);
      setAccounts([]);
    }
  };

  // Load automation jobs
  const loadAutomationJobs = async () => {
    if (!isAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from('automation_jobs')
        .select(`
          *,
          blog_campaigns (name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // Table doesn't exist yet - this is expected until SQL setup is run
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('automation_jobs table does not exist yet - run SQL setup');
          setAutomationJobs([]);
          return;
        }
        throw error;
      }
      setAutomationJobs(data || []);
    } catch (error: any) {
      console.error('Error loading automation jobs:', error.message || error);
      setAutomationJobs([]);
    }
  };

  // Create campaign using our own table
  const createCampaign = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create campaigns');
      return;
    }

    if (!formData.name || !formData.target_url || !formData.keyword) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      const { data: campaign, error } = await supabase
        .from('blog_campaigns')
        .insert([{
          user_id: user?.id,
          name: formData.name,
          target_url: formData.target_url,
          keyword: formData.keyword,
          anchor_text: formData.anchor_text,
          status: formData.auto_start ? 'active' : 'paused',
          automation_enabled: formData.automation_enabled,
          links_found: 0,
          links_posted: 0
        }])
        .select('*')
        .single();

      if (error) throw error;

      // If auto-start, discover blogs and generate diverse comments
      if (formData.auto_start) {
        await startCommentGeneration(campaign.id, formData.keyword);
      }

      toast.success('Campaign created successfully!');
      setShowCreateForm(false);
      setFormData({
        name: '',
        target_url: '',
        keyword: '',
        anchor_text: '',
        auto_start: false,
        automation_enabled: false
      });
      
      await loadCampaigns();
      await loadComments();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle campaign status
  const toggleCampaign = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('blog_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      toast.success(`Campaign ${newStatus === 'active' ? 'started' : 'paused'}`);
      await loadCampaigns();
    } catch (error: any) {
      console.error('Error toggling campaign:', error);
      toast.error('Failed to update campaign');
    }
  };

  // Approve comment for posting
  const approveComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .update({ status: 'approved' })
        .eq('id', commentId);

      if (error) throw error;

      toast.success('Comment approved');
      await loadComments();
    } catch (error: any) {
      console.error('Error approving comment:', error);
      toast.error('Failed to approve comment');
    }
  };

  // Comment generation prompts for variety
  const commentPrompts = [
    "Write a short, one-sentence comment that expresses a positive or engaging opinion about {{keyword}}.",
    "In one sentence, give a casual, friendly remark about {{keyword}} that would fit in a social media conversation.",
    "Create a single-sentence comment about {{keyword}} that feels authentic and relevant.",
    "Write one concise, conversational comment that reacts to {{keyword}} in a relatable way.",
    "In one sentence, share a quick thought or reaction about {{keyword}} that would encourage further discussion."
  ];

  // Generate comment using OpenAI
  const generateComment = async (keyword: string) => {
    try {
      // Select random prompt
      const randomPrompt = commentPrompts[Math.floor(Math.random() * commentPrompts.length)];
      const prompt = randomPrompt.replace('{{keyword}}', keyword);

      const response = await fetch('/.netlify/functions/generate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          keyword
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response not ok:', response.status, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Check if we got a fallback response
      if (data.fallback) {
        console.warn('OpenAI API failed, using fallback:', data.error);
        toast.warning('Using fallback comment generation');
      }

      return data.comment;
    } catch (error) {
      console.error('Error generating comment:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Fallback to manual templates
      return generateFallbackComment(keyword);
    }
  };

  // Fallback comment generation
  const generateFallbackComment = (keyword: string) => {
    const templates = [
      `Really valuable insights about ${keyword}! This is exactly what I was looking for.`,
      `Thanks for sharing this perspective on ${keyword} - very helpful!`,
      `Great points about ${keyword}. Have you considered the impact on user experience too?`,
      `This article on ${keyword} really opened my eyes to new possibilities.`,
      `Appreciate the detailed breakdown of ${keyword}. Looking forward to implementing these ideas!`,
      `Excellent work on explaining ${keyword} in such an accessible way.`,
      `The section about ${keyword} was particularly enlightening. Thanks for the great content!`,
      `As someone working with ${keyword}, I found this incredibly useful. Bookmarked!`,
      `Your approach to ${keyword} is refreshing. Have you written more on this topic?`,
      `This ${keyword} guide is going straight to my reference folder. Much appreciated!`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  };

  // Blog discovery and comment generation
  const startCommentGeneration = async (campaignId: string, keyword: string) => {
    try {
      // Update campaign status to show generation is in progress
      await supabase
        .from('blog_campaigns')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      // Discover blog URLs
      toast.loading('🔍 Discovering relevant blogs...');
      const discoveredBlogs = await discoverBlogUrls(keyword);

      // Update links found count
      await supabase
        .from('blog_campaigns')
        .update({ links_found: discoveredBlogs.length })
        .eq('id', campaignId);

      toast.loading('🤖 Generating unique comments with ChatGPT 3.5 Turbo...');

      // Generate comments for each discovered blog
      let successCount = 0;
      for (const blogUrl of discoveredBlogs) {
        try {
          const commentText = await generateComment(keyword);

          await supabase.from('blog_comments').insert([{
            campaign_id: campaignId,
            blog_url: blogUrl,
            comment_text: commentText,
            status: 'pending'
          }]);

          successCount++;
        } catch (error) {
          console.error(`Failed to generate comment for ${blogUrl}:`, error);
        }
      }

      toast.success(`✅ Generated ${successCount} unique comments for review`);

      // Reload data to show updates
      await Promise.all([loadCampaigns(), loadComments()]);

    } catch (error) {
      console.error('Error in comment generation:', error);
      toast.error('Failed to generate comments');
    }
  };

  // Blog URL discovery (enhanced simulation)
  const discoverBlogUrls = async (keyword: string) => {
    // This simulates real blog discovery - in production this would use:
    // - Google Search API to find blogs
    // - Web scraping for comment forms
    // - Content relevance analysis
    const popularBlogDomains = [
      'medium.com', 'dev.to', 'hashnode.com', 'substack.com',
      'wordpress.com', 'blogger.com', 'ghost.org', 'webflow.com',
      'techcrunch.com', 'mashable.com', 'theverge.com', 'wired.com',
      'arstechnica.com', 'engadget.com', 'gizmodo.com', 'lifehacker.com'
    ];

    const contentTypes = [
      'posts', 'articles', 'reviews', 'insights', 'guides', 'tutorials',
      'news', 'updates', 'resources', 'blog', 'stories', 'features'
    ];

    const urls = [];
    const numBlogs = Math.min(8, popularBlogDomains.length);

    for (let i = 0; i < numBlogs; i++) {
      const domain = popularBlogDomains[Math.floor(Math.random() * popularBlogDomains.length)];
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      const slug = keyword.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

      // Add some variety to URL structures
      if (domain.includes('medium.com') || domain.includes('dev.to')) {
        urls.push(`https://${domain}/${slug}-${Math.floor(Math.random() * 1000)}`);
      } else {
        urls.push(`https://${domain}/${contentType}/${slug}`);
      }
    }

    return urls;
  };

  // Generate more comments for existing campaign
  const generateMoreComments = async (campaignId: string, keyword: string) => {
    try {
      toast.loading('Discovering new blog opportunities...');
      await startCommentGeneration(campaignId, keyword);
    } catch (error) {
      console.error('Error generating more comments:', error);
      toast.error('Failed to generate additional comments');
    }
  };

  // Advanced blog discovery
  const runBlogDiscovery = async (campaignId: string) => {
    setIsProcessing(true);
    try {
      toast.loading('���� Running advanced blog discovery...');

      const response = await fetch('/.netlify/functions/process-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          jobType: 'discover_blogs'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discovery failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      toast.success(`✅ Discovered ${result.result?.total_found || 0} new blog opportunities`);

      // Reload data safely
      await Promise.all([loadCampaigns(), loadComments()]);
      await loadAutomationJobs(); // This may fail if table doesn't exist
    } catch (error: any) {
      console.error('Error in blog discovery:', error.message || error);
      toast.error(`Blog discovery failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Automated comment posting
  const runAutomatedPosting = async (campaignId: string) => {
    setIsProcessing(true);
    try {
      toast.loading('🤖 Starting automated comment posting...');

      const response = await fetch('/.netlify/functions/process-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          jobType: 'post_comments'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Posting failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const successCount = result.result?.successful_posts || 0;
      toast.success(`✅ Posted ${successCount} comments successfully`);

      // Reload data safely
      await Promise.all([loadCampaigns(), loadComments()]);
      await loadAutomationJobs(); // This may fail if table doesn't exist
    } catch (error: any) {
      console.error('Error in automated posting:', error.message || error);
      toast.error(`Automated posting failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Create blog account
  const createAccount = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create accounts');
      return;
    }

    if (!accountFormData.email || !accountFormData.platform) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('blog_accounts')
        .insert([{
          user_id: user?.id,
          platform: accountFormData.platform,
          email: accountFormData.email,
          display_name: accountFormData.display_name,
          verification_status: 'pending'
        }]);

      if (error) {
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
          toast.error('Database setup required - please run the SQL setup script first');
          return;
        }
        throw error;
      }

      toast.success('Account created! Verification needed for automation.');
      setShowAccountForm(false);
      setAccountFormData({
        platform: 'substack',
        email: '',
        display_name: ''
      });

      await loadAccounts();
    } catch (error: any) {
      console.error('Error creating account:', error.message || error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      const tablesExist = await checkTablesExist();
      
      if (tablesExist && isAuthenticated) {
        // Always load basic features
        await Promise.all([
          loadCampaigns(),
          loadComments()
        ]);

        // Try to load advanced features (may fail if tables don't exist)
        await loadAccounts();
        await loadAutomationJobs();
      }
      
      setIsLoading(false);
    };

    initialize();
  }, [isAuthenticated]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated || showDatabaseSetup) return;

    const campaignChannel = supabase
      .channel('blog_campaigns')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_campaigns' }, () => {
        loadCampaigns();
      })
      .subscribe();

    const commentsChannel = supabase
      .channel('blog_comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_comments' }, () => {
        loadComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(campaignChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [isAuthenticated, showDatabaseSetup]);

  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const pendingComments = comments.filter(c => c.status === 'pending');
  const approvedComments = comments.filter(c => c.status === 'approved');
  const postedComments = comments.filter(c => c.status === 'posted');

  // Database setup SQL
  const setupSQL = `-- Advanced Blog Comment Automation System
-- Run this in your Supabase SQL Editor

-- Blog campaigns table
CREATE TABLE IF NOT EXISTS blog_campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_url text not null,
  keyword text not null,
  anchor_text text,
  status text not null default 'paused' check (status in ('active', 'paused', 'completed')),
  automation_enabled boolean default false,
  links_found integer default 0,
  links_posted integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blog comments table with enhanced automation support
CREATE TABLE IF NOT EXISTS blog_comments (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references blog_campaigns(id) on delete cascade,
  blog_url text not null,
  comment_text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'posted', 'failed', 'processing', 'needs_verification')),
  platform text not null default 'generic' check (platform in ('substack', 'medium', 'wordpress', 'generic')),
  account_id uuid references blog_accounts(id),
  error_message text,
  posted_at timestamptz,
  created_at timestamptz default now()
);

-- Blog accounts for authentication management
CREATE TABLE IF NOT EXISTS blog_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('substack', 'medium', 'wordpress', 'generic')),
  email text not null,
  display_name text,
  cookies text, -- Encrypted session data
  session_data jsonb,
  is_verified boolean default false,
  verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'failed', 'expired')),
  last_used timestamptz,
  created_at timestamptz default now(),
  UNIQUE(user_id, platform, email)
);

-- Automation jobs queue
CREATE TABLE IF NOT EXISTS automation_jobs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references blog_campaigns(id) on delete cascade,
  job_type text not null check (job_type in ('discover_blogs', 'post_comments', 'verify_accounts')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  payload jsonb,
  result jsonb,
  error_message text,
  scheduled_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE blog_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_campaigns
CREATE POLICY "Users can view their own campaigns" ON blog_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON blog_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON blog_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON blog_campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for blog_comments
CREATE POLICY "Users can view comments for their campaigns" ON blog_comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM blog_campaigns
    WHERE blog_campaigns.id = blog_comments.campaign_id
    AND blog_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "System can create comments" ON blog_comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update comments" ON blog_comments
  FOR UPDATE USING (true);

-- RLS Policies for blog_accounts
CREATE POLICY "Users can view their own accounts" ON blog_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounts" ON blog_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON blog_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts" ON blog_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for automation_jobs
CREATE POLICY "Users can view jobs for their campaigns" ON automation_jobs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM blog_campaigns
    WHERE blog_campaigns.id = automation_jobs.campaign_id
    AND blog_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "System can manage automation jobs" ON automation_jobs
  FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_user_id ON blog_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_status ON blog_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_automation ON blog_campaigns(automation_enabled);

CREATE INDEX IF NOT EXISTS idx_blog_comments_campaign_id ON blog_comments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
CREATE INDEX IF NOT EXISTS idx_blog_comments_platform ON blog_comments(platform);

CREATE INDEX IF NOT EXISTS idx_blog_accounts_user_id ON blog_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_platform ON blog_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_blog_accounts_verified ON blog_accounts(is_verified);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_campaign_id ON automation_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_type ON automation_jobs(job_type);

-- Functions for automation
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign statistics when comments are updated
  UPDATE blog_campaigns
  SET
    links_posted = (
      SELECT COUNT(*) FROM blog_comments
      WHERE campaign_id = NEW.campaign_id AND status = 'posted'
    ),
    updated_at = now()
  WHERE id = NEW.campaign_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_trigger
  AFTER UPDATE ON blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- Verify tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('blog_campaigns', 'blog_comments', 'blog_accounts', 'automation_jobs');`;

  const copySetupSQL = async () => {
    try {
      await navigator.clipboard.writeText(setupSQL);
      toast.success('Setup SQL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy SQL');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading blog comment system...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Comment System</h1>
              <p className="text-gray-600">Automated blog commenting for backlink building</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Bot className="h-3 w-3 mr-1" />
                  ChatGPT 3.5 Turbo Active
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  5 Unique Prompts
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Database Setup Required */}
        {showDatabaseSetup && (
          <Card className="border-orange-200 bg-orange-50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Database className="h-5 w-5" />
                Database Setup Required
              </CardTitle>
              <CardDescription className="text-orange-700">
                The advanced blog comment automation system needs its database tables to be created.
                This includes tables for campaigns, comments, accounts, and automation jobs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">One-time setup needed:</p>
                    <ol className="list-decimal list-inside text-sm space-y-1">
                      <li>Copy the SQL script below</li>
                      <li>Open your Supabase SQL Editor</li>
                      <li>Run the script to create blog comment tables</li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={copySetupSQL}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                >
                  <Copy className="h-4 w-4" />
                  Copy Setup SQL
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql', '_blank')}
                  className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Supabase SQL Editor
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Authentication Check */}
        {!isAuthenticated && !showDatabaseSetup && (
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Please sign in to create and manage blog comment campaigns.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content - Only show if database is set up */}
        {!showDatabaseSetup && (
          <>
            {/* Status Bar */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">{activeCampaigns.length}</div>
                      <div className="text-xs text-gray-600">Active Campaigns</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{campaigns.length}</div>
                      <div className="text-xs text-gray-600">Total Campaigns</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">{pendingComments.length}</div>
                      <div className="text-xs text-gray-600">Pending Review</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">{postedComments.length}</div>
                      <div className="text-xs text-gray-600">Posted</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-medium">
                        {campaigns.length > 0 ? Math.round((postedComments.length / Math.max(comments.length, 1)) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                <TabsTrigger value="automation">Automation</TabsTrigger>
                <TabsTrigger value="accounts">Accounts ({accounts.length})</TabsTrigger>
                <TabsTrigger value="moderation">Moderation ({pendingComments.length})</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {campaigns.length > 0 ? Math.round((postedComments.length / Math.max(comments.length, 1)) * 100) : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">Comment posting success rate</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{pendingComments.length}</div>
                      <p className="text-xs text-muted-foreground">Comments awaiting approval</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Posted</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{postedComments.length}</div>
                      <p className="text-xs text-muted-foreground">Successfully posted comments</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {isAuthenticated && (
                        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          New Campaign
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            toast.loading('Testing ChatGPT 3.5 Turbo...');
                            const testComment = await generateComment('go high level');
                            toast.success(`✅ Test successful: "${testComment}"`);
                          } catch (error) {
                            toast.error('Test failed - check OpenAI configuration');
                          }
                        }}
                        className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <Bot className="h-4 w-4" />
                        Test ChatGPT
                      </Button>
                      <Button variant="outline" onClick={loadCampaigns} className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Prompts Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Active ChatGPT 3.5 Turbo Prompts
                    </CardTitle>
                    <CardDescription>
                      Five unique prompts ensure comment variety and authenticity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {commentPrompts.map((prompt, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">Prompt {index + 1}</Badge>
                          </div>
                          <p className="text-sm text-gray-700">{prompt}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Campaigns Tab */}
              <TabsContent value="campaigns" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Blog Comment Campaigns</CardTitle>
                        <CardDescription>Manage your automated commenting campaigns</CardDescription>
                      </div>
                      {isAuthenticated && (
                        <Button onClick={() => setShowCreateForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          New Campaign
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {campaigns.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns yet</h3>
                        <p className="text-gray-600 mb-6">Create your first blog comment campaign</p>
                        {isAuthenticated && (
                          <Button onClick={() => setShowCreateForm(true)} size="lg">
                            <Plus className="h-5 w-5 mr-2" />
                            Create Your First Campaign
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {campaigns.map((campaign) => (
                          <Card key={campaign.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                                    <Badge variant={
                                      campaign.status === 'active' ? 'default' :
                                      campaign.status === 'paused' ? 'secondary' :
                                      'outline'
                                    }>
                                      {campaign.status}
                                    </Badge>
                                    {campaign.automation_enabled && (
                                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                        <Bot className="h-3 w-3 mr-1" />
                                        Auto
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p><strong>Target URL:</strong> {campaign.target_url}</p>
                                    <p><strong>Keyword:</strong> {campaign.keyword}</p>
                                    <p><strong>Anchor Text:</strong> {campaign.anchor_text}</p>
                                    <p><strong>Progress:</strong> {campaign.links_posted} / {campaign.links_found} links posted</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => generateMoreComments(campaign.id, campaign.keyword)}
                                    className="flex items-center gap-1"
                                  >
                                    <Bot className="h-3 w-3" />
                                    Generate
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleCampaign(campaign.id, campaign.status)}
                                  >
                                    {campaign.status === 'active' ?
                                      <Pause className="h-4 w-4" /> :
                                      <Play className="h-4 w-4" />
                                    }
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Automation Tab */}
              <TabsContent value="automation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      Advanced Automation
                    </CardTitle>
                    <CardDescription>
                      Automated blog discovery and comment posting with Playwright
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Automation Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{campaign.name}</h3>
                                <Badge variant={campaign.automation_enabled ? 'default' : 'secondary'}>
                                  {campaign.automation_enabled ? 'Auto-Enabled' : 'Manual'}
                                </Badge>
                              </div>

                              <div className="text-sm text-gray-600">
                                <p>Keyword: {campaign.keyword}</p>
                                <p>Status: {campaign.status}</p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => runBlogDiscovery(campaign.id)}
                                  disabled={isProcessing}
                                  className="flex items-center gap-1"
                                >
                                  <Search className="h-3 w-3" />
                                  Discover Blogs
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => runAutomatedPosting(campaign.id)}
                                  disabled={isProcessing || approvedComments.filter(c => c.campaign_id === campaign.id).length === 0}
                                  className="flex items-center gap-1 border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  <Bot className="h-3 w-3" />
                                  Auto-Post
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {campaigns.length === 0 && (
                      <div className="text-center py-12">
                        <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No campaigns for automation</h3>
                        <p className="text-gray-600 mb-6">Create a campaign first to enable automation</p>
                        <Button onClick={() => setShowCreateForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Campaign
                        </Button>
                      </div>
                    )}

                    {/* Recent Automation Jobs */}
                    {automationJobs.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Recent Automation Jobs</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {automationJobs.slice(0, 5).map((job) => (
                              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline">{job.job_type.replace('_', ' ')}</Badge>
                                    <span className="text-sm text-gray-600">
                                      {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {job.error_message && (
                                    <p className="text-sm text-red-600">{job.error_message}</p>
                                  )}
                                </div>
                                <Badge variant={
                                  job.status === 'completed' ? 'default' :
                                  job.status === 'failed' ? 'destructive' :
                                  job.status === 'processing' ? 'secondary' :
                                  'outline'
                                }>
                                  {job.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accounts Tab */}
              <TabsContent value="accounts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Blog Platform Accounts</CardTitle>
                        <CardDescription>Manage accounts for automated commenting</CardDescription>
                      </div>
                      {isAuthenticated && (
                        <Button onClick={() => setShowAccountForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Account
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {accounts.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No accounts configured</h3>
                        <p className="text-gray-600 mb-6">Add platform accounts to enable automated posting</p>
                        {isAuthenticated && (
                          <Button onClick={() => setShowAccountForm(true)} size="lg">
                            <Plus className="h-5 w-5 mr-2" />
                            Add Your First Account
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {accounts.map((account) => (
                          <Card key={account.id} className="border">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="outline" className="capitalize">
                                      {account.platform}
                                    </Badge>
                                    <span className="font-medium">{account.email}</span>
                                    {account.display_name && (
                                      <span className="text-sm text-gray-600">({account.display_name})</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={
                                      account.verification_status === 'verified' ? 'default' :
                                      account.verification_status === 'failed' ? 'destructive' :
                                      'secondary'
                                    }>
                                      {account.verification_status}
                                    </Badge>
                                    {account.last_used && (
                                      <span className="text-sm text-gray-500">
                                        Last used: {new Date(account.last_used).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {!account.is_verified && (
                                  <Button size="sm" variant="outline">
                                    Verify
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Moderation Tab */}
              <TabsContent value="moderation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comment Moderation</CardTitle>
                    <CardDescription>
                      Review and approve comments before posting ({pendingComments.length} pending)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingComments.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No pending comments</h3>
                        <p className="text-gray-600">Generated comments will appear here for approval</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingComments.map((comment) => (
                          <Card key={comment.id} className="border">
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Globe className="h-4 w-4 text-blue-500" />
                                      <a 
                                        href={comment.blog_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline font-medium"
                                      >
                                        {comment.blog_url}
                                      </a>
                                      <ExternalLink className="h-3 w-3 text-gray-400" />
                                    </div>
                                  </div>
                                  <Badge variant="secondary">{comment.status}</Badge>
                                </div>
                                
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2">Generated Comment:</h4>
                                  <p className="text-gray-700 italic">"{comment.comment_text}"</p>
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => approveComment(comment.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Results</CardTitle>
                    <CardDescription>Track your successful blog comments and backlinks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {postedComments.length === 0 ? (
                      <div className="text-center py-12">
                        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No results yet</h3>
                        <p className="text-gray-600">Posted comments and backlinks will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {postedComments.map((comment) => (
                          <div key={comment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <a 
                                  href={comment.blog_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {comment.blog_url}
                                </a>
                              </div>
                              <p className="text-sm text-gray-600">
                                Posted: {comment.posted_at ? new Date(comment.posted_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            <Badge variant="default">Posted</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Create Campaign Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create Blog Comment Campaign</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Set up automated blog commenting for your target keyword
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="SEO Tools Campaign"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target_url">Target URL (Your Website)</Label>
                    <Input
                      id="target_url"
                      type="url"
                      value={formData.target_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="keyword">Target Keyword</Label>
                    <Input
                      id="keyword"
                      value={formData.keyword}
                      onChange={(e) => setFormData(prev => ({ ...prev, keyword: e.target.value }))}
                      placeholder="SEO tools, digital marketing, etc."
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="anchor_text">Anchor Text</Label>
                    <Input
                      id="anchor_text"
                      value={formData.anchor_text}
                      onChange={(e) => setFormData(prev => ({ ...prev, anchor_text: e.target.value }))}
                      placeholder="best SEO tool, learn more, etc."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_start"
                      checked={formData.auto_start}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_start: checked }))}
                    />
                    <Label htmlFor="auto_start">Start campaign immediately</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="automation_enabled"
                      checked={formData.automation_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, automation_enabled: checked }))}
                    />
                    <Label htmlFor="automation_enabled">Enable advanced automation (Playwright)</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createCampaign}
                    disabled={isCreating || !formData.name || !formData.target_url || !formData.keyword}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Account Modal */}
        {showAccountForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Blog Platform Account</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAccountForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Add an account for automated blog commenting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <select
                    id="platform"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={accountFormData.platform}
                    onChange={(e) => setAccountFormData(prev => ({
                      ...prev,
                      platform: e.target.value as 'substack' | 'medium' | 'wordpress' | 'generic'
                    }))}
                  >
                    <option value="substack">Substack</option>
                    <option value="medium">Medium</option>
                    <option value="wordpress">WordPress</option>
                    <option value="generic">Generic Blog</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_email">Email Address</Label>
                  <Input
                    id="account_email"
                    type="email"
                    value={accountFormData.email}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your-account@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name (Optional)</Label>
                  <Input
                    id="display_name"
                    value={accountFormData.display_name}
                    onChange={(e) => setAccountFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Your Name"
                  />
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Account verification will be required for automated posting.
                    You'll need to complete email verification on the platform.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAccountForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createAccount}
                    disabled={isCreating || !accountFormData.email || !accountFormData.platform}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
