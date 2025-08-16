import { useState, useEffect, startTransition, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/beautiful-blog.css';
import '../styles/blog-template.css';
import { LinkAttributeFixer } from '@/utils/linkAttributeFixer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ClaimLoginModal } from '@/components/ClaimLoginModal';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EnhancedUnifiedPaymentModal } from '@/components/EnhancedUnifiedPaymentModal';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Calendar,
  Eye,
  TrendingUp,
  Target,
  Share2,
  Copy,
  Clock,
  Crown,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Timer,
  User,
  Shield,
  ShieldCheck,
  XCircle,
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageCircle,
  Globe,
  Zap,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedBlogClaimService } from '@/services/enhancedBlogClaimService';
import { usePremiumSEOScore } from '@/hooks/usePremiumSEOScore';
import { blogService } from '@/services/blogService';
import { BlogProcessorTester } from '@/utils/testBlogProcessor';
import BlogErrorBoundary from '@/components/BlogErrorBoundary';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { maskEmail } from '@/utils/emailMasker';
import { SEOScoreDisplay } from '@/components/SEOScoreDisplay';
import { KillerDeletionWarning } from '@/components/KillerDeletionWarning';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
// Temporarily removed potentially problematic imports for debugging
// import { BlogContentCleaner } from '@/utils/blogContentCleaner';
// import { BlogAutoAdjustmentService } from '@/services/blogAutoAdjustmentService';
// import { BlogQualityMonitor } from '@/utils/blogQualityMonitor';
import { EnhancedBlogCleaner } from '@/utils/enhancedBlogCleaner';
import { processBlogContent } from '@/utils/markdownProcessor';

type BlogPost = Tables<'blog_posts'>;

export function BeautifulBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Track component mount status to prevent promise rejections after unmount
  const [isMounted, setIsMounted] = useState(true);
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [authorEmail, setAuthorEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [unclaiming, setUnclaiming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnclaimDialog, setShowUnclaimDialog] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showKillerWarning, setShowKillerWarning] = useState(false);
  const [showSystemExplanation, setShowSystemExplanation] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Use premium SEO score logic
  const { effectiveScore, isPremiumScore } = usePremiumSEOScore(blogPost);

  // Memoize expensive calculations for performance
  const memoizedBlogTitle = useMemo(() => {
    return blogPost ? EnhancedBlogCleaner.cleanTitle(blogPost.title) : '';
  }, [blogPost?.title]);

  const memoizedReadingTime = useMemo(() => {
    return blogPost?.reading_time || 0;
  }, [blogPost?.reading_time]);

  const memoizedFormattedDate = useMemo(() => {
    try {
      if (!blogPost?.created_at) return 'Date unknown';
      const date = new Date(blogPost.created_at);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'MMMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error, 'Value:', blogPost?.created_at);
      return 'Date error';
    }
  }, [blogPost?.created_at]);

  // Cleanup component mount flag on unmount
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Setup database table if missing
  useEffect(() => {
    const setupDatabaseIfNeeded = async () => {
      try {
        // Test if published_blog_posts table exists by trying a simple query
        const { error } = await supabase
          .from('published_blog_posts')
          .select('id')
          .limit(1);

        // If table doesn't exist, try setup but don't fail completely
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          console.log('🔧 published_blog_posts table missing, attempting setup...');

          try {
            // Import and run emergency setup
            const { EmergencyDatabaseSetup } = await import('@/utils/emergencyDatabaseSetup');
            const result = await EmergencyDatabaseSetup.setupDatabase();

            if (result.success) {
              console.log('✅ Database setup completed, retrying blog load...');
              toast({
                title: "Blog Post Created",
                description: "The missing blog post has been created. Reloading...",
              });

              // Retry loading the blog post after setup
              if (slug) {
                setTimeout(() => {
                  setLoading(true);
                  setError(null);
                  loadBlogPost(slug);
                }, 1000);
              }
            } else {
              console.error('❌ Database setup failed:', result.message);
              // Don't show error toast, just log it
              console.log('⚠️ Setup failed but continuing normally...');
            }
          } catch (setupError) {
            console.error('❌ Failed to setup database:', setupError);
            // Don't show error toast, just log it
            console.log('⚠️ Setup failed but continuing normally...');
          }
        }
      } catch (err) {
        console.warn('Database check failed:', err);
      }
    };

    setupDatabaseIfNeeded();
  }, [slug, toast]);

  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug]);

  // Add testing utilities to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testBlogProcessor = () => BlogProcessorTester.runAllTests();
      (window as any).testCurrentBlogPost = () => {
        if (blogPost?.content) {
          BlogProcessorTester.testCustomContent(blogPost.content, blogPost.title);
        } else {
          console.log('No blog post loaded to test');
        }
      };
      // (window as any).BlogAutoAdjustmentService = BlogAutoAdjustmentService;
    }
  }, [blogPost]);

  useEffect(() => {
    if (user) {
      processClaimIntent();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setReadingProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Exit intent detection for unclaimed posts
  useEffect(() => {
    if (!blogPost || blogPost.claimed || user) return;

    let isExiting = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isExiting) {
        isExiting = true;
        setShowExitPopup(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [blogPost, user]);

  // Automatic 3-second popup for unclaimed posts
  useEffect(() => {
    if (!blogPost || blogPost.claimed || user) return;

    const timer = setTimeout(() => {
      setShowExitPopup(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [blogPost, user]);

  // Client-side cleanup of malformed content after rendering - DISABLED
  useEffect(() => {
    // DISABLED: All client-side content manipulation to prevent spacing issues
    // No automatic formatting or space manipulation will occur
    return;
  }, [blogPost]);

  const processClaimIntent = async () => {
    try {
      // Only process claim intents for signed-in users
      if (!user) {
        // Clear any claim intents if user is not authenticated to prevent processing on login
        localStorage.removeItem('claim_intent');
        return;
      }

      // Check if there's actually a claim intent before processing
      const claimIntentStr = localStorage.getItem('claim_intent');
      if (!claimIntentStr) return; // No pending claim intent, don't show notifications

      // Double-check user is still authenticated before processing
      if (!user.id) {
        localStorage.removeItem('claim_intent');
        return;
      }

      const result = await EnhancedBlogClaimService.processPendingClaimIntent(user);
      if (result) {
        if (result.success) {
          toast({
            title: "Post Claimed! 🎉",
            description: result.message,
          });
          if (slug) await loadBlogPost(slug);
        } else {
          toast({
            title: "Claim Failed",
            description: result.message,
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Error processing claim intent:', error);
      // Clear the intent if it's causing issues
      localStorage.removeItem('claim_intent');
      toast({
        title: "Claim Processing Error",
        description: "There was an issue processing your claim. Please try again.",
        variant: "destructive"
      });
    }
  };

  const loadBlogPost = useCallback(async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading blog post with slug:', slug);

      // First try database, if that fails, try localStorage fallback
      let post = null;
      try {
        post = await blogService.getBlogPostBySlug(slug);
        console.log('📡 Database query result:', post ? 'Found' : 'Not found');
        if (post) {
          console.log('📄 Database post details:');
          console.log('  - ID:', post.id);
          console.log('  - Title:', post.title || 'NO TITLE');
          console.log('  - Status:', post.status);
          console.log('  - Content length:', post.content?.length || 0);
          console.log('  - Created:', post.created_at);
          console.log('  - Claimed:', post.claimed);
        }
      } catch (dbError) {
        console.warn('Database lookup failed, trying localStorage fallback:', dbError);
        // Try to load from localStorage as fallback
        const localStoragePost = localStorage.getItem(`blog_post_${slug}`);
        if (localStoragePost) {
          try {
            post = JSON.parse(localStoragePost);
            console.log('Loaded from localStorage fallback');
          } catch (parseError) {
            console.error('Failed to parse localStorage data:', parseError);
          }
        }
      }

      if (!isMounted) return; // Prevent state update after unmount

      if (!post) {
        const notFoundError = new Error(`Blog post not found: ${slug}`);
        setError(notFoundError);
        setBlogPost(null);
        return;
      }

      setBlogPost(post);

      // If post is claimed, fetch the author's email
      if (post?.claimed && post?.user_id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', post.user_id)
            .single();

          if (profile?.email && isMounted) {
            setAuthorEmail(profile.email);
          }
        } catch (emailError: any) {
          const errorMessage = emailError.message || emailError;
          // Only log unexpected errors, not permission issues
          if (!errorMessage.includes('permission denied') && !errorMessage.includes('relation')) {
            console.log('Could not fetch author email:', emailError);
          }
          // Don't show error to user, just don't display email
        }
      } else {
        setAuthorEmail(null);
      }
    } catch (error: any) {
      console.error('Failed to load blog post:', error);

      if (!isMounted) return; // Prevent error handling after unmount

      setError(error);
      setBlogPost(null);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [isMounted, toast]);

  const handleClaimPost = async () => {
    if (!user) {
      // Store claim intent and show modal instead of navigating
      EnhancedBlogClaimService.handleClaimIntent(slug!, EnhancedBlogCleaner.cleanTitle(blogPost?.title || ''));
      setShowClaimModal(true);
      return;
    }

    setClaiming(true);
    try {
      const result = await EnhancedBlogClaimService.claimPost(slug!, user);
      
      if (result.success) {
        if (isMounted) {
          setBlogPost(result.post!);
        }
        toast({
          title: "Success! 🎉",
          description: result.message,
        });
      } else {
        toast({
          title: "Claim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while claiming the post",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleUnclaimPost = async () => {
    setUnclaiming(true);
    try {
      const result = await EnhancedBlogClaimService.unclaimPost(slug!, user);

      if (result.success) {
        setBlogPost(result.post!);
        toast({
          title: "Post Unclaimed",
          description: result.message,
        });
      } else {
        toast({
          title: "Unclaim Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while unclaiming the post",
        variant: "destructive"
      });
    } finally {
      setUnclaiming(false);
      setShowUnclaimDialog(false);
    }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      console.log('🗑️ Attempting to delete post:', {
        slug,
        userId: user?.id,
        blogPostUserId: blogPost?.user_id,
        isClaimed: blogPost?.claimed,
        isOwnPost: blogPost?.user_id === user?.id
      });

      // Try direct deletion via Supabase
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('slug', slug!);

      if (error) {
        console.error('❌ Direct delete failed:', error);

        // If RLS blocks the delete, try using a serverless function as fallback
        try {
          console.log('🔄 Trying API fallback for delete...');
          const response = await fetch('/.netlify/functions/delete-post', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.access_token || ''}`
            },
            body: JSON.stringify({ slug })
          });

          console.log('📡 API Response Status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.log('📡 API Error:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          if (result.success) {
            toast({
              title: "Post Deleted",
              description: "The blog post has been successfully deleted.",
            });
            startTransition(() => {
              navigate('/blog');
            });
          } else {
            throw new Error(result.message || 'Delete failed');
          }
        } catch (apiError: any) {
          console.error('❌ API delete also failed:', apiError);
          // Try a more direct approach for development/admin purposes
          if (process.env.NODE_ENV === 'development' || user?.email?.includes('admin')) {
            try {
              console.log('🔧 Attempting direct admin delete...');
              // For development or admin users, try to delete without RLS checks
              const { error: adminError } = await supabase.rpc('delete_blog_post_admin', { post_slug: slug });

              if (!adminError) {
                toast({
                  title: "Post Deleted (Admin)",
                  description: "The blog post has been successfully deleted using admin privileges.",
                });
                startTransition(() => {
                  navigate('/blog');
                });
                return;
              }
            } catch (adminError) {
              console.log('🔧 Admin delete not available');
            }
          }

          toast({
            title: "Delete Failed",
            description: `Unable to delete post: ${error.message}. This may be due to permission restrictions or the post being protected by another user.`,
            variant: "destructive"
          });
        }
      } else {
        console.log('✅ Direct delete succeeded');
        toast({
          title: "Post Deleted",
          description: "The blog post has been successfully deleted.",
        });
        startTransition(() => {
          navigate('/blog');
        });
      }
    } catch (error: any) {
      console.error('❌ Unexpected delete error:', error);
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAuthSuccess = async (user: any) => {
    // After successful login/signup, automatically attempt to claim the post
    setShowClaimModal(false);

    // Small delay to let the auth state update
    setTimeout(async () => {
      try {
        const result = await EnhancedBlogClaimService.claimPost(slug!, user);

        if (result.success) {
          setBlogPost(result.post!);
          toast({
            title: "Success! 🎉",
            description: "You've successfully claimed this post!",
          });
        } else {
          toast({
            title: "Claim Failed",
            description: result.message,
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Error claiming post after auth:', {
          error: error?.message || error,
          slug,
          userId: user?.id
        });
        toast({
          title: "Error",
          description: "An unexpected error occurred while claiming the post",
          variant: "destructive"
        });
      }
    }, 1000);
  };

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "URL Copied!",
        description: "Blog post URL copied to clipboard",
      });
    } catch (error: any) {
      console.error('Failed to copy to clipboard:', {
        error: error?.message || error,
        url: window.location.href
      });
      // Fallback: try using the old-school method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast({
          title: "URL Copied!",
          description: "Blog post URL copied to clipboard",
        });
      } catch (fallbackError: any) {
        console.error('Fallback copy also failed:', fallbackError);
        toast({
          title: "Copy Failed",
          description: "Unable to copy URL to clipboard",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blogPost?.title,
          text: blogPost?.meta_description || blogPost?.excerpt,
          url: window.location.href,
        });
      } catch (error: any) {
        console.error('Error sharing:', {
          error: error?.message || error,
          title: blogPost?.title
        });
        // If native sharing fails, fall back to copying
        if (error?.name !== 'AbortError') { // Don't show error if user cancelled
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  };

  const cleanTitle = (title: string) => {
    if (!title) return '';
    // Enhanced title cleaning with better pattern matching
    return title
      .replace(/^\s*\*\*Title:\s*([^*]*)\*\*\s*/i, '$1') // Remove **Title:** wrapper and extract content
      .replace(/^\*\*H1\*\*:\s*/i, '')
      .replace(/^\*\*Title\*\*:\s*/i, '') // Remove **Title**: prefix
      .replace(/^Title:\s*/gi, '') // Remove Title: prefix (global + case insensitive)
      .replace(/^H[1-6]:\s*/gi, '') // Remove H1:, H2:, etc. prefixes
      .replace(/Hook Introduction:\s*["=]*\s*H[1-6]:\s*/gi, '') // Remove "Hook Introduction: "="H1: " pattern
      .replace(/["=]+\s*H[1-6]:\s*/gi, '') // Remove "="H1: " pattern
      .replace(/Hook Introduction:\s*/gi, '') // Remove standalone Hook Introduction:
      .replace(/^Conclusion:\s*/gi, '') // Remove Conclusion: prefix
      .replace(/^Call-to-Action:\s*/gi, '') // Remove Call-to-Action: prefix
      .replace(/Conclusion:\s*/gi, '') // Remove Conclusion: anywhere
      .replace(/Call-to-Action:\s*/gi, '') // Remove Call-to-Action: anywhere
      .replace(/^\*\*([^*]+?)\*\*:\s*/i, '$1')
      .replace(/^\*\*(.+?)\*\*$/i, '$1') // Handle **title** format
      .replace(/\*\*/g, '') // Remove any remaining ** symbols
      .replace(/\*/g, '') // Remove any remaining * symbols
      .replace(/^#{1,6}\s+/, '')
      .replace(/^Title:\s*/gi, '') // Final cleanup for any remaining Title: patterns
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Apply beautiful content structure formatting
  const applyBeautifulContentStructure = (content: string, title: string = '') => {
    if (!content) return '';

    let formattedContent = content;

    // Step 1: Remove link placement syntax and clean up content
    formattedContent = formattedContent
      // Hide link placement syntax and content generation artifacts
      .replace(/Natural Link Integration:\s*/gi, '')
      .replace(/Link Placement:\s*/gi, '')
      .replace(/Anchor Text:\s*/gi, '')
      .replace(/URL Integration:\s*/gi, '')
      .replace(/Link Strategy:\s*/gi, '')
      .replace(/Backlink Placement:\s*/gi, '')
      .replace(/Internal Link:\s*/gi, '')
      .replace(/External Link:\s*/gi, '')
      .replace(/Content Section:\s*/gi, '')
      .replace(/Blog Section:\s*/gi, '')
      .replace(/Article Part:\s*/gi, '')
      .replace(/Content Block:\s*/gi, '')

      // Convert **text** to <strong>text</strong> before removing other ** markers
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert __text__ to <strong>text</strong>
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      // Remove remaining problematic markers
      .replace(/\*{2,}/g, '') // Remove remaining ** markers
      .replace(/_{2,}/g, '') // Remove remaining __ markers
      .replace(/\bH[1-6]:\s*/gi, '')
      .replace(/Title:\s*/gi, '')
      .replace(/Hook Introduction:\s*/gi, '')
      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Step 2: Enhanced markdown formatting to HTML conversion
    formattedContent = formattedContent
      // Enhanced link processing - Convert markdown links [text](url) to HTML
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        // Clean up the anchor text - remove any link placement syntax
        const cleanText = text
          .replace(/^(Natural Link Integration|Link Placement|Anchor Text|URL Integration):\s*/gi, '')
          .trim();

        // Ensure URL is properly formatted
        let cleanUrl = url.trim();
        if (cleanUrl && !cleanUrl.match(/^https?:\/\//)) {
          cleanUrl = cleanUrl.startsWith('//') ? 'https:' + cleanUrl : 'https://' + cleanUrl;
        }

        return `<a href="${cleanUrl}">${cleanText}</a>`;
      })

      // Convert markdown headings (### heading) to HTML
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Convert italic text *text* to <em>text</em> (single asterisks)
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
      // Convert italic text _text_ to <em>text</em>
      .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')
      // Convert inline code `code` to <code>code</code>
      .replace(/`([^`]+)`/g, '<code>$1</code>')

      // Convert plain URLs to clickable links (simple approach)
      .replace(/\b(https?:\/\/[^\s<>"']+)/gi, (match, url) => {
        // Only convert if not already inside a tag
        return `<a href="${url}">${url}</a>`;
      });

    // Step 2.5: Comprehensive duplicate title removal
    if (title) {
      const titleClean = title.toLowerCase().trim();
      const titleEscaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Remove title from start of content if it matches (plain text)
      formattedContent = formattedContent.replace(new RegExp(`^\\s*${titleEscaped}\\s*`, 'i'), '');

      // Remove title wrapped in any heading tags
      formattedContent = formattedContent.replace(new RegExp(`^\\s*<h[1-6][^>]*>\\s*${titleEscaped}\\s*</h[1-6]>\\s*`, 'i'), '');

      // Remove title wrapped in strong tags
      formattedContent = formattedContent.replace(new RegExp(`^\\s*<strong>\\s*${titleEscaped}\\s*</strong>\\s*`, 'i'), '');

      // Remove title wrapped in heading tags with strong tags inside
      formattedContent = formattedContent.replace(new RegExp(`^\\s*<h[1-6][^>]*>\\s*<strong>\\s*${titleEscaped}\\s*</strong>\\s*</h[1-6]>\\s*`, 'i'), '');

      // Remove title anywhere in content that appears as a standalone heading
      formattedContent = formattedContent.replace(new RegExp(`\\n\\s*<h[1-6][^>]*>\\s*(?:<strong>\\s*)?${titleEscaped}(?:\\s*</strong>)?\\s*</h[1-6]>\\s*\\n`, 'gi'), '\n\n');

      // Remove title as standalone paragraph
      formattedContent = formattedContent.replace(new RegExp(`\\n\\s*<p[^>]*>\\s*(?:<strong>\\s*)?${titleEscaped}(?:\\s*</strong>)?\\s*</p>\\s*\\n`, 'gi'), '\n\n');
    }

    // Step 3: Convert remaining markdown-style formatting to HTML if needed
    if (!formattedContent.includes('<p>')) {
      // Convert remaining **text** to <strong>text</strong> (if not already converted)
      formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Split into paragraphs and process
      const paragraphs = formattedContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);

      let htmlContent = '';
      for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i].trim();

        // Skip empty or invalid content
        if (!para || para === '****' || para.match(/^\*+$/)) {
          continue;
        }

        // Skip if this paragraph matches the blog title (duplicate title removal)
        // Remove HTML tags for comparison
        const paraTextOnly = para.replace(/<[^>]*>/g, '').trim();
        if (title && (para.toLowerCase().trim() === title.toLowerCase().trim() || paraTextOnly.toLowerCase() === title.toLowerCase().trim())) {
          continue;
        }

        // Enhanced heading detection - Check if it's a heading (short line with title-like content) but NOT the blog title
        const isLikelyHeading = para.length < 150 && (
          // Section patterns
          para.match(/^Section\s+\d+:/i) ||
          para.match(/^Part\s+\d+:/i) ||
          para.match(/^Chapter\s+\d+:/i) ||
          para.match(/^\d+\.\s+[A-Z]/i) ||
          para.match(/^Step\s+\d+:/i) ||

          // Common heading patterns
          (para.includes('Introduction') && !para.includes('Hook Introduction')) ||
          para.includes('Conclusion') ||
          para.includes('Strategy') ||
          para.includes('Overview') ||
          para.includes('Summary') ||
          para.includes('Benefits') ||
          para.includes('Advantages') ||
          para.includes('Implementation') ||
          para.includes('Best Practices') ||
          para.includes('Key Points') ||
          para.includes('Important') ||
          para.includes('Essential') ||
          para.includes('Critical') ||

          // Short capitalized lines (likely headings)
          (para.split(' ').length <= 10 &&
           para.charAt(0).toUpperCase() === para.charAt(0) &&
           para.split(' ').every(word => word.length > 2 ? word.charAt(0).toUpperCase() === word.charAt(0) : true)) ||

          // Lines ending with colon (section headers)
          (para.endsWith(':') && para.split(' ').length <= 8 && para.charAt(0).toUpperCase() === para.charAt(0))
        );

        // Don't convert to heading if it matches the title or is too similar
        const isTitle = title && (paraTextOnly.toLowerCase() === title.toLowerCase() ||
                                 para.toLowerCase().trim() === title.toLowerCase().trim());

        if (isLikelyHeading && !isTitle) {
          htmlContent += `<h2>${para}</h2>\n\n`;
        }
        // Check if it's a numbered list item
        else if (para.match(/^\d+\./)) {
          // If this is the start of a list, open <ol>
          if (i === 0 || !paragraphs[i-1].match(/^\d+\./)) {
            htmlContent += '<ol>\n';
          }
          const listContent = para.replace(/^\d+\.\s*/, '');
          htmlContent += `<li>${listContent}</li>\n`;

          // If next paragraph is not a list item, close </ol>
          if (i === paragraphs.length - 1 || !paragraphs[i+1].match(/^\d+\./)) {
            htmlContent += '</ol>\n\n';
          }
        }
        // Check if it's a bullet point (expanded patterns)
        else if (para.match(/^[•·\-\*]\s/) || para.match(/^\*\s/) || para.match(/^-\s/)) {
          // If this is the start of a list, open <ul>
          if (i === 0 || !paragraphs[i-1].match(/^[•·\-\*]\s/) && !paragraphs[i-1].match(/^\*\s/) && !paragraphs[i-1].match(/^-\s/)) {
            htmlContent += '<ul>\n';
          }
          const listContent = para.replace(/^[•·\-\*]\s*/, '').replace(/^\*\s*/, '').replace(/^-\s*/, '');
          htmlContent += `<li>${listContent}</li>\n`;

          // If next paragraph is not a list item, close </ul>
          if (i === paragraphs.length - 1 || (!paragraphs[i+1].match(/^[•·\-\*]\s/) && !paragraphs[i+1].match(/^\*\s/) && !paragraphs[i+1].match(/^-\s/))) {
            htmlContent += '</ul>\n\n';
          }
        }
        // Regular paragraph
        else {
          htmlContent += `<p>${para}</p>\n\n`;
        }
      }
      formattedContent = htmlContent;
    }

    // Step 4: Apply premium HTML structure with beautiful classes and remove duplicate titles
    formattedContent = formattedContent
      .replace(/<h1([^>]*)>(.*?)<\/h1>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        // Remove HTML tags from heading text for comparison
        const textOnly = cleanText.replace(/<[^>]*>/g, '').trim();
        // Skip if this heading matches the blog title (remove duplicate)
        if (title && (cleanText.toLowerCase() === title.toLowerCase() || textOnly.toLowerCase() === title.toLowerCase())) {
          return '';
        }
        return `<h1 class="beautiful-prose text-4xl md:text-5xl font-black mb-8 leading-tight text-black"${attrs}>${cleanText}</h1>`;
      })
      .replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        // Remove HTML tags from heading text for comparison
        const textOnly = cleanText.replace(/<[^>]*>/g, '').trim();
        // Skip if this heading matches the blog title (remove duplicate)
        if (title && (cleanText.toLowerCase() === title.toLowerCase() || textOnly.toLowerCase() === title.toLowerCase())) {
          return '';
        }
        return `<h2 class="beautiful-prose text-3xl font-bold text-black mb-6 mt-12"${attrs}>${cleanText}</h2>`;
      })
      .replace(/<h3([^>]*)>(.*?)<\/h3>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        // Remove HTML tags from heading text for comparison
        const textOnly = cleanText.replace(/<[^>]*>/g, '').trim();
        // Skip if this heading matches the blog title (remove duplicate)
        if (title && (cleanText.toLowerCase() === title.toLowerCase() || textOnly.toLowerCase() === title.toLowerCase())) {
          return '';
        }
        return `<h3 class="beautiful-prose text-2xl font-semibold text-black mb-4 mt-8"${attrs}>${cleanText}</h3>`;
      });

    // Step 5: Enhanced paragraphs with beautiful typography
    formattedContent = formattedContent
      .replace(/<p([^>]*)>(.*?)<\/p>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        if (cleanText.length === 0) return '';
        return `<p class="beautiful-prose text-lg leading-relaxed text-gray-700 mb-6"${attrs}>${cleanText}</p>`;
      });

    // Step 6: Beautiful lists with premium styling
    formattedContent = formattedContent
      .replace(/<ul([^>]*)>/gi, '<ul class="beautiful-prose space-y-4 my-8"$1>')
      .replace(/<ol([^>]*)>/gi, '<ol class="beautiful-prose space-y-4 my-8"$1>')
      .replace(/<li([^>]*)>(.*?)<\/li>/gi, (match, attrs, text) => {
        const cleanText = text.trim();
        return `<li class="beautiful-prose relative pl-8 text-lg leading-relaxed text-gray-700"${attrs}>${cleanText}</li>`;
      });

    // Step 7: Enhanced links with beautiful styling and improved anchor text
    formattedContent = formattedContent.replace(
      /<a([^>]*?)href="([^"]*)"([^>]*?)>(.*?)<\/a>/gi,
      (match, preAttrs, href, postAttrs, text) => {
        // Clean up anchor text - remove any remaining link syntax
        let cleanText = text
          .replace(/^(Natural Link Integration|Link Placement|Anchor Text|URL Integration|Link Strategy|Backlink Placement|Internal Link|External Link):\s*/gi, '')
          .trim();

        // If anchor text is empty or just whitespace, use a portion of the URL
        if (!cleanText || cleanText.length === 0) {
          try {
            const url = new URL(href);
            cleanText = url.hostname.replace('www.', '') || href;
          } catch {
            cleanText = href;
          }
        }

        // Ensure URL is properly formatted
        let cleanHref = href.trim();
        if (cleanHref && !cleanHref.match(/^https?:\/\//) && !cleanHref.startsWith('/')) {
          cleanHref = cleanHref.startsWith('//') ? 'https:' + cleanHref : 'https://' + cleanHref;
        }

        const isExternal = cleanHref.startsWith('http');
        const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a class="beautiful-prose text-blue-600 hover:text-purple-600 font-semibold transition-colors duration-300 underline decoration-2 underline-offset-2 hover:decoration-purple-600"${preAttrs}href="${cleanHref}"${postAttrs}${targetAttr}>${cleanText}</a>`;
      }
    );

    // Step 8: Beautiful blockquotes
    formattedContent = formattedContent.replace(
      /<blockquote([^>]*)>(.*?)<\/blockquote>/gis,
      (match, attrs, text) => {
        const cleanText = text.trim();
        return `<blockquote class="beautiful-prose border-l-4 border-blue-500 pl-6 py-4 my-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-r-lg italic text-xl text-gray-700"${attrs}>${cleanText}</blockquote>`;
      }
    );

    // Step 9: Enhanced images with beautiful wrapper
    formattedContent = formattedContent.replace(
      /<img([^>]*?)src="([^"]*)"([^>]*?)>/gi,
      (match, preAttrs, src, postAttrs) => {
        const altMatch = match.match(/alt="([^"]*)"/);
        const alt = altMatch ? altMatch[1] : '';

        return `<div class="beautiful-prose my-8">
          <img class="rounded-lg shadow-lg w-full h-auto"${preAttrs}src="${src}"${postAttrs} loading="lazy">
          ${alt ? `<div class="text-center text-sm text-gray-500 mt-2 italic">${alt}</div>` : ''}
        </div>`;
      }
    );

    // Step 10: Enhanced code blocks
    formattedContent = formattedContent.replace(
      /<code([^>]*)>(.*?)<\/code>/gi,
      (match, attrs, text) => {
        return `<code class="beautiful-prose bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 px-3 py-1 rounded-lg font-mono text-sm"${attrs}>${text}</code>`;
      }
    );

    // Step 11: Apply drop cap to first paragraph
    formattedContent = formattedContent.replace(
      /<p class="beautiful-prose([^"]*)"([^>]*)>(.*?)<\/p>/,
      '<p class="beautiful-prose$1 beautiful-first-paragraph"$2>$3</p>'
    );

    // Step 12: Final cleanup - remove problematic content patterns and duplicate titles
    if (title) {
      const titleEscaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Final pass to remove any remaining title duplicates
      formattedContent = formattedContent
        .replace(new RegExp(`<h[1-6][^>]*>\\s*(?:<[^>]*>\\s*)*${titleEscaped}(?:\\s*<[^>]*>)*\\s*</h[1-6]>`, 'gi'), '')
        .replace(new RegExp(`<p[^>]*>\\s*(?:<[^>]*>\\s*)*${titleEscaped}(?:\\s*<[^>]*>)*\\s*</p>`, 'gi'), '');
    }

    formattedContent = formattedContent
      // Remove empty or invalid headings
      .replace(/<h[1-6][^>]*>\s*\*+\s*<\/h[1-6]>/gi, '')
      .replace(/<h[1-6][^>]*>\s*<\/h[1-6]>/gi, '')
      .replace(/<h[1-6][^>]*>\s*\d+\.\s*<\/h[1-6]>/gi, '')
      // Remove empty paragraphs
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      .replace(/<p[^>]*>\s*\*+\s*<\/p>/gi, '')
      // Fix spacing
      .replace(/>\s+</g, '><')
      .replace(/(<\/h[1-6]>)\s*(<p)/gi, '$1\n\n$2')
      .replace(/(<\/p>)\s*(<h[1-6])/gi, '$1\n\n$2')
      .replace(/(<\/ul>|<\/ol>)\s*(<p)/gi, '$1\n\n$2')
      .replace(/(<\/p>)\s*(<ul>|<ol>)/gi, '$1\n\n$2')
      .trim();

    return formattedContent;
  };

  const autoRemoveTitlesFromContent = (content: string, pageTitle: string) => {
    if (!content) return '';

    let cleaned = content;

    // Remove problematic section headers and artifacts that cause poor formatting
    cleaned = cleaned
      // Remove section markers that create poor structure
      .replace(/^(Introduction|Section \d+|Conclusion|Call-to-Action):\s*/gim, '')
      .replace(/^(Hook Introduction|Summary|Overview):\s*/gim, '')

      // Remove HTML artifacts that appear as text
      .replace(/\bH[1-6]:\s*/gi, '')
      .replace(/Title:\s*/gi, '')
      .replace(/Hook Introduction:\s*/gi, '')

      // Remove markdown artifacts that don't render properly
      .replace(/^#+\s*/gm, '')
      .replace(/^>\s*/gm, '')

      // Remove repeated symbols that clutter content
      .replace(/["=]{2,}/g, '')

      // Clean up excessive whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Remove duplicate title if provided
    if (pageTitle) {
      const cleanedPageTitle = cleanTitle(pageTitle).toLowerCase().trim();
      if (cleanedPageTitle) {
        // Simple title removal at the beginning of content
        const lines = cleaned.split('\n');
        if (lines.length > 0) {
          const firstLine = cleanTitle(lines[0]).toLowerCase().trim();
          if (firstLine === cleanedPageTitle ||
              cleanedPageTitle.includes(firstLine) ||
              firstLine.includes(cleanedPageTitle)) {
            lines.shift(); // Remove first line if it matches title
            cleaned = lines.join('\n').trim();
          }
        }
      }
    }

    // Process through the clean markdown processor instead of complex DOM manipulation
    return processBlogContent(cleaned);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const canClaimPost = blogPost ? EnhancedBlogClaimService.canClaimPost(blogPost) : false;
  const unclaimPermissions = blogPost ? EnhancedBlogClaimService.canUnclaimPost(blogPost, user) : { canUnclaim: false };
  const deletePermissions = blogPost ? EnhancedBlogClaimService.canDeletePost(blogPost, user) : { canDelete: false };

  // Determine if user can delete this post
  const isOwnPost = blogPost?.user_id === user?.id;
  const isUnclaimedPost = blogPost && (!blogPost.claimed || blogPost.user_id === null);
  const canDelete = isOwnPost || isUnclaimedPost || deletePermissions.canDelete;
  const isExpiringSoon = blogPost?.expires_at && new Date(blogPost.expires_at).getTime() - Date.now() < 2 * 60 * 60 * 1000;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
            </div>
            <p className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loading blog post...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error boundary if there's an error or no blog post
  if (error || !blogPost) {
    return (
      <>
        <Header />
        <BlogErrorBoundary
          error={error || new Error('Blog post not found')}
          slug={slug}
          onRetry={() => slug && loadBlogPost(slug)}
          showDebugInfo={process.env.NODE_ENV === 'development'}
        />
        <Footer />
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="beautiful-blog-wrapper min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Reading Progress Bar */}
      <div
        className="reading-progress-bar fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 z-50 transition-all duration-300 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
      
      <Header />

      {/* Floating Action Bar - Hidden on mobile */}
      <div className="hidden lg:flex fixed right-6 top-1/2 transform -translate-y-1/2 z-40 flex-col space-y-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-11 h-11 rounded-full bg-white/90 border border-gray-200 shadow-md hover:bg-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-gray-600 hover:text-blue-600 hover:scale-110 backdrop-blur-sm"
          onClick={() => setIsBookmarked(!isBookmarked)}
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-5 w-5 text-blue-600" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-11 h-11 rounded-full bg-white/90 border border-gray-200 shadow-md hover:bg-white hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 text-gray-600 hover:text-red-600 hover:scale-110 backdrop-blur-sm"
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-current' : ''}`} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-11 h-11 rounded-full bg-white/90 border border-gray-200 shadow-md hover:bg-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-gray-600 hover:text-purple-600 hover:scale-110 backdrop-blur-sm"
          onClick={sharePost}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation Bar */}
      <div className="beautiful-nav sticky top-16 z-30 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => startTransition(() => navigate('/blog'))}
              className="flex items-center gap-2 hover:bg-transparent hover:text-blue-600 px-4 py-2 rounded-full transition-all duration-300 border border-transparent hover:border-blue-200/50 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
            <div className="flex items-center gap-2 md:gap-3">
              <Button variant="outline" size="sm" onClick={sharePost} className="hidden md:flex rounded-full bg-transparent border-gray-200 hover:bg-transparent hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all duration-300">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={sharePost} className="flex md:hidden rounded-full bg-transparent border-gray-200 hover:bg-transparent hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all duration-300">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="hidden md:flex rounded-full bg-transparent border-gray-200 hover:bg-transparent hover:border-purple-300 hover:text-purple-600 hover:shadow-md transition-all duration-300">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex md:hidden rounded-full bg-transparent border-gray-200 hover:bg-transparent hover:border-purple-300 hover:text-purple-600 hover:shadow-md transition-all duration-300">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="beautiful-blog-hero relative overflow-hidden pt-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="w-full">
          <article className="w-full">

            {/* Article Header */}
            <header className="text-center mb-16 relative max-w-5xl mx-auto px-6 pt-12">


              {/* Status Badges */}
              <div className="flex items-center justify-center gap-3 mb-8">
                {blogPost.claimed ? (
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full text-green-700 shadow-sm cursor-help">
                          <CheckCircle2 className="h-5 w-5" />
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {isOwnPost ? 'You own this post' : 'This post has been claimed'}
                            </span>
                            {!isOwnPost && authorEmail && (
                              <span className="text-xs text-green-600 mt-1">
                                by {maskEmail(authorEmail)}
                              </span>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{isOwnPost ? 'Your Post' : 'Claimed Post'}</p>
                          <p className="text-sm">
                            {isOwnPost
                              ? 'You own this post and can manage it freely.'
                              : 'This post is owned by another user and protected from deletion.'}
                          </p>
                          {isOwnPost && <p className="text-xs text-green-400">✨ You have full control</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Action Buttons - Show next to claimed status for owned posts */}
                    {isOwnPost && (
                      <div className="flex items-center gap-2">
                        {/* Unclaim Button */}
                        {unclaimPermissions.canUnclaim && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => setShowUnclaimDialog(true)}
                                variant="outline"
                                size="sm"
                                className="bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300 text-orange-700 hover:from-orange-200 hover:to-orange-300 hover:border-orange-400 hover:text-orange-800 hover:scale-105 px-4 py-2 rounded-full transition-all duration-300"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Unclaim
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">Unclaim Post</p>
                                <p className="text-sm">
                                  Release ownership and make this post available for others to claim.
                                </p>
                                <p className="text-xs text-orange-400">⏰ Will be deleted in 24 hours if not reclaimed</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Delete Button */}
                        {canDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => setShowDeleteDialog(true)}
                                variant="outline"
                                size="sm"
                                className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 hover:text-gray-800 hover:scale-105 px-4 py-2 rounded-full transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">Delete Post</p>
                                <p className="text-sm">
                                  Permanently delete this post. As the owner, you have full permission to remove it at any time.
                                </p>
                                <p className="text-xs text-red-400">⚠️ This action cannot be undone</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 cursor-help">
                          <Timer className="mr-2 h-4 w-4" />
                          Unclaimed
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">Unclaimed</p>
                          <p className="text-sm">This post is unclaimed and anyone can take ownership of it.</p>
                          <p className="text-xs text-gray-400">���️ May be deleted if not claimed soon</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Delete Button - Show next to unclaimed status for unclaimed posts */}
                    {canDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setShowDeleteDialog(true)}
                            variant="outline"
                            size="sm"
                            className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 hover:text-gray-800 hover:scale-105 px-4 py-2 rounded-full transition-all duration-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">Delete Post</p>
                            <p className="text-sm">
                              Delete this unclaimed post. Anyone can delete unclaimed posts to help clean up content.
                            </p>
                            <p className="text-xs text-red-400">⚠️ This action cannot be undone</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Login to Claim Button - Show next to unclaimed status */}
                    {canClaimPost && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleClaimPost}
                            disabled={claiming}
                            size="sm"
                            variant="outline"
                            className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 hover:text-gray-800 hover:scale-105 px-4 py-2 rounded-full transition-all duration-300"
                          >
                            {claiming ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                Claiming...
                              </>
                            ) : (
                              <>
                                <Crown className="mr-2 h-4 w-4" />
                                {user ? 'Claim' : 'Login to Claim'}
                                <Zap className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold">Claim Post</p>
                            <p className="text-sm">Become the owner of this post to protect it from deletion and gain editing rights.</p>
                            <p className="text-xs text-blue-400">💡 Free to claim!</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
                
                {blogPost.claimed && isOwnPost && (
                  <Badge className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 rounded-full">
                    <User className="mr-2 h-4 w-4" />
                    Your Post
                  </Badge>
                )}
                
                {!blogPost.claimed && blogPost.expires_at && isExpiringSoon && (
                  <Badge className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse rounded-full shadow-lg">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Expiring Soon
                  </Badge>
                )}
              </div>

              {/* Title with enhanced styling and accessibility */}
              <h1
                className="beautiful-blog-title text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight break-words bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent"
                role="heading"
                aria-level={1}
              >
                {memoizedBlogTitle}
              </h1>

              {/* Meta Description */}
              {blogPost.meta_description && (
                <p className="beautiful-blog-subtitle text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto">
                  {blogPost.meta_description}
                </p>
              )}

              {/* Article Meta */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-gray-500 mb-8">
                <div className="beautiful-meta flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time
                    className="font-medium text-sm md:text-base"
                    dateTime={blogPost.created_at}
                  >
                    {memoizedFormattedDate}
                  </time>
                </div>
                <div className="beautiful-meta flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium text-sm md:text-base">{memoizedReadingTime} min read</span>
                </div>
                <div className="beautiful-meta flex items-center gap-2">
                  <SEOScoreDisplay
                    score={effectiveScore}
                    title={blogPost.title}
                    content={blogPost.content}
                    metaDescription={blogPost.meta_description || undefined}
                    targetKeyword={blogPost.keywords?.[0]}
                    showDetails={true}
                    isPremiumScore={isPremiumScore}
                  />
                </div>
              </div>


            </header>



            {/* Article Content */}
            <div className="prose prose-lg max-w-none mt-8">
              <div className="beautiful-card max-w-5xl mx-auto pt-6 px-6 pb-8 md:pt-8 md:px-12 md:pb-12 lg:px-16">
                <div
                  className="beautiful-blog-content beautiful-prose modern-blog-content article-content prose prose-xl max-w-none prose-headings:font-bold prose-headings:text-black prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-li:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-strong:font-bold prose-strong:text-gray-900 prose-img:rounded-lg prose-img:shadow-lg"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    lineHeight: '1.8',
                    color: 'rgb(55, 65, 81)',
                    maxWidth: 'none',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: (() => {
                      try {
                        const content = blogPost.content || '';

                        console.log('🔍 BeautifulBlogPost content debug:', {
                          postId: blogPost.id,
                          slug: blogPost.slug,
                          contentLength: content.length,
                          isEmpty: !content || content.trim().length === 0,
                          contentPreview: content.substring(0, 100),
                          hasHtmlTags: content.includes('<'),
                          performance: {
                            timestamp: Date.now(),
                            memoryUsage: (performance as any)?.memory?.usedJSHeapSize || 'unavailable'
                          }
                        });

                        if (!content || content.trim().length === 0) {
                          console.error('❌ Blog post has no content:', {
                            postId: blogPost.id,
                            slug: blogPost.slug,
                            title: blogPost.title
                          });

                          return `
                            <div style="padding: 40px; text-align: center; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 20px 0;">
                              <h3 style="color: #dc2626; margin-bottom: 16px;">Content Error</h3>
                              <p style="color: #7f1d1d; margin-bottom: 16px;">This blog post appears to have no content in the database.</p>
                              <details style="text-align: left; background: white; padding: 16px; border-radius: 4px; border: 1px solid #f3f4f6;">
                                <summary style="cursor: pointer; font-weight: 600; color: #374151;">Debug Information</summary>
                                <pre style="margin-top: 8px; font-size: 12px; color: #6b7280;">Post ID: ${blogPost.id}\nSlug: ${blogPost.slug}\nTitle: ${blogPost.title || 'No title'}\nStatus: ${blogPost.status || 'unknown'}\nCreated: ${blogPost.created_at || 'unknown'}</pre>
                              </details>
                            </div>
                          `;
                        }

                        // Enhanced processing with performance monitoring
                        const processingStart = performance.now();
                        let finalContent = applyBeautifulContentStructure(content, blogPost.title);
                        const processingTime = performance.now() - processingStart;

                        console.log('⚡ Content processing performance:', {
                          processingTimeMs: Math.round(processingTime * 100) / 100,
                          contentSizeKB: Math.round((content.length / 1024) * 100) / 100,
                          outputSizeKB: Math.round((finalContent.length / 1024) * 100) / 100,
                          efficiency: Math.round((content.length / processingTime) * 100) / 100 + ' chars/ms'
                        });

                        // Basic security check only - remove scripts and dangerous elements
                        finalContent = finalContent
                          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                          .replace(/javascript:/gi, '')
                          .replace(/on\w+\s*=/gi, '');
                        // Variables are already defined above as finalContent and securityInfo

                        // Enhanced logging with performance metrics
                        console.log('✅ Blog content processing complete:', {
                          originalLength: content.length,
                          finalLength: finalContent.length,
                          hasStructure: finalContent.includes('<h1>') || finalContent.includes('<h2>') || finalContent.includes('<p>'),
                          processingTimeMs: Math.round(processingTime * 100) / 100,
                          efficiency: Math.round((content.length / processingTime) * 100) / 100 + ' chars/ms',
                          compressionRatio: Math.round((finalContent.length / content.length) * 100) + '%',
                          hasImages: finalContent.includes('<img'),
                          hasLinks: finalContent.includes('<a '),
                          hasLists: finalContent.includes('<ul') || finalContent.includes('<ol'),
                          processedSuccessfully: true
                        });

                        // Final safety check with enhanced fallback
                        if (!finalContent || finalContent.trim().length === 0) {
                          console.error('⚠️ Content became empty after processing! Using enhanced fallback.');
                          // Try basic markdown processing as emergency fallback
                          try {
                            const emergencyContent = processBlogContent(content);
                            if (emergencyContent && emergencyContent.trim().length > 0) {
                              console.log('🔄 Emergency content processing succeeded');
                              return emergencyContent;
                            }
                          } catch (emergencyError) {
                            console.error('Emergency processing also failed:', emergencyError);
                          }

                          // Ultimate fallback: return sanitized raw content
                          const sanitizedContent = content
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n/g, '<br>')
                            .trim();

                          return `
                            <div style="padding: 20px; border: 2px solid #f59e0b; border-radius: 8px; background: #fef3c7;">
                              <h3 style="color: #d97706; margin-bottom: 12px;">⚠️ Content Processing Issue</h3>
                              <p style="color: #92400e; margin-bottom: 12px;">The content couldn't be processed properly. Showing raw content below:</p>
                              <div style="background: white; padding: 16px; border-radius: 4px; font-family: monospace; white-space: pre-wrap;">
                                ${sanitizedContent}
                              </div>
                            </div>
                          `;
                        }

                        return finalContent;
                      } catch (formatError) {
                        console.error('💥 Content processing failed:', formatError);
                        // Return cleaned raw content as emergency fallback
                        const rawContent = blogPost.content || '';
                        if (rawContent) {
                          // Basic HTML escape for safety
                          const escapedContent = rawContent
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/\n/g, '<br>');
                          return `<div style="padding: 20px;"><h3>Content Processing Error</h3><div style="white-space: pre-wrap; font-family: inherit; color: #666;">${escapedContent}</div></div>`;
                        }
                        return '<div style="padding: 20px; color: #ef4444;">Content could not be loaded or processed.</div>';
                      }
                    })()
                  }}
                />
              </div>
            </div>

            {/* Keywords Section */}
            {blogPost.keywords && blogPost.keywords.length > 0 && (
              <div className="mt-12 p-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 max-w-5xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Keywords & Topics
                </h3>
                <div className="flex flex-wrap gap-3">
                  {blogPost.keywords.map((keyword, index) => (
                    <Badge 
                      key={index} 
                      variant="outline"
                      className="px-4 py-2 bg-white/80 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 transition-all duration-300 rounded-full"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Section */}
            <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 max-w-5xl mx-auto">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Enjoyed this article?
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Share it with your network and help others discover great content!
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={sharePost} variant="outline" className="bg-transparent border-blue-200 text-blue-600 hover:bg-transparent hover:border-blue-400 hover:text-blue-700 hover:shadow-lg hover:scale-105 rounded-full px-6 transition-all duration-300">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Article
                  </Button>
                  <Button variant="outline" onClick={copyToClipboard} className="bg-transparent border-gray-200 hover:bg-transparent hover:border-purple-300 hover:text-purple-600 hover:shadow-lg hover:scale-105 rounded-full px-6 transition-all duration-300">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>

            {/* Premium Upgrade CTA Section */}
            <div className="mt-12 p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-purple-600 mr-3" />
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Unlock Premium Features
                  </h3>
                </div>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  Get unlimited access to premium blog content, advanced SEO tools, and exclusive features.
                  Take your content strategy to the next level!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-purple-100">
                    <Sparkles className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Unlimited Content</h4>
                    <p className="text-sm text-gray-600">Access all premium blog posts and SEO content</p>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-purple-100">
                    <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Advanced Analytics</h4>
                    <p className="text-sm text-gray-600">Detailed performance metrics and insights</p>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-purple-100">
                    <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Priority Support</h4>
                    <p className="text-sm text-gray-600">24/7 expert assistance when you need it</p>
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    console.log('🚀 Premium button clicked!', { showPaymentModal, e });
                    e.stopPropagation();
                    e.preventDefault();
                    setShowPaymentModal(true);
                    console.log('🚀 Payment modal state set to true');
                  }}
                  className="relative w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-full shadow-lg px-8 py-4 text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 z-10"
                  size="lg"
                  disabled={false}
                  type="button"
                  style={{
                    pointerEvents: 'auto',
                    zIndex: 10,
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Upgrade to Premium
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="mt-4 text-sm text-gray-500">
                  ✨ Join thousands of users already growing their online presence
                </p>
              </div>
            </div>

            {/* Post Information Section */}
            <div className="mt-12 space-y-6 max-w-5xl mx-auto px-6">
              {/* ENHANCED EXPIRATION WARNING WITH KILLER DELETION ALERT */}
              {!blogPost.claimed && blogPost.expires_at && (
                <div className="space-y-4">

                  {/* Real-time danger alerts based on time remaining */}
                  {(() => {
                    const timeLeft = getTimeRemaining(blogPost.expires_at);
                    const [hours] = timeLeft.split(':').map(Number);
                    if (hours <= 1) {
                      return (
                        <div className="max-w-2xl mx-auto bg-red-600 text-white p-4 rounded-lg animate-pulse border-4 border-yellow-400">
                          <div className="text-center font-black text-lg">
                            💀 CRITICAL: LESS THAN 1 HOUR REMAINING! ⚠️⚠️⚠️
                          </div>
                          <div className="text-center text-sm mt-2">
                            Your content is entering the DEATH ZONE!
                          </div>
                        </div>
                      );
                    } else if (hours <= 6) {
                      return (
                        <div className="max-w-2xl mx-auto bg-orange-600 text-white p-4 rounded-lg animate-pulse">
                          <div className="text-center font-bold">
                            ⚠�� WARNING: Content expires in {hours} hours!
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}



              {/* Action Buttons - Moved here below Target URL */}
              <div className="flex flex-wrap justify-center gap-4 mt-8 max-w-2xl mx-auto">
                {/* Action buttons section - unclaim button moved to top */}
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-6 w-6 text-red-600" />
              Delete Blog Post
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-lg">Are you sure you want to delete "{blogPost.title}"? This action cannot be undone.</p>
                {blogPost.claimed && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="font-semibold">Important Notice</span>
                    </div>
                    <p className="text-sm">This is a claimed post. Deletion should be carefully considered.</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Post'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unclaim Confirmation Dialog */}
      <AlertDialog open={showUnclaimDialog} onOpenChange={setShowUnclaimDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <XCircle className="h-6 w-6 text-orange-600" />
              Unclaim Blog Post
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-lg">Are you sure you want to unclaim "{blogPost.title}"?</p>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Important:</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>• This post will return to the claimable pool for 24 hours</li>
                    <li>���� Other users will be able to claim it during this time</li>
                    <li>• If not reclaimed, it will be automatically deleted</li>
                    <li>• You can reclaim it yourself if it's still available</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-full">Keep Claimed</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnclaimPost}
              disabled={unclaiming}
              className="bg-orange-600 hover:bg-orange-700 rounded-full"
            >
              {unclaiming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Unclaiming...
                </>
              ) : (
                'Unclaim Post'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Claim Login Modal */}
      <ClaimLoginModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onAuthSuccess={handleAuthSuccess}
        postTitle={EnhancedBlogCleaner.cleanTitle(blogPost?.title || '')}
        postSlug={slug || ''}
      />

      {/* KILLER DELETION WARNING POPUP */}
      {showKillerWarning && blogPost.expires_at && (
        <KillerDeletionWarning
          onSaveContent={() => {
            setShowKillerWarning(false);
            setShowClaimModal(true);
          }}
          onLogin={() => {
            setShowKillerWarning(false);
            setShowClaimModal(true);
          }}
          timeRemaining={getTimeRemaining(blogPost.expires_at)}
          contentTitle={blogPost.title}
          targetUrl={blogPost.target_url || 'your website'}
          onClose={() => setShowKillerWarning(false)}
        />
      )}

      {/* Exit Intent Popup */}
      <ExitIntentPopup
        isVisible={showExitPopup}
        onClose={() => setShowExitPopup(false)}
        postTitle={EnhancedBlogCleaner.cleanTitle(blogPost?.title || '')}
        timeRemaining={blogPost?.expires_at ? getTimeRemaining(blogPost.expires_at) : '24 hours'}
      />

      {/* Premium Payment Modal */}
      <EnhancedUnifiedPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        defaultTab="premium"
        onSuccess={() => {
          setShowPaymentModal(false);
          toast({
            title: "Welcome to Premium! 🎉",
            description: "Your premium subscription has been activated. You now have unlimited access!",
          });
        }}
      />

      {/* Beautiful System Explanation Modal */}
      {showSystemExplanation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">How Our Content System Works</h2>
                    <p className="text-blue-100 mt-1">Understanding content ownership and preservation</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowSystemExplanation(false)}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <XCircle className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Step-by-step explanation */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="text-center space-y-4">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Content Created</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    AI generates high-quality blog content that's immediately available for viewing and sharing.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center space-y-4">
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Timer className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Grace Period</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Content is available for a limited time, giving users the opportunity to claim valuable pieces.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center space-y-4">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Crown className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Ownership</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Claiming gives you permanent ownership, full editorial control, and protection from deletion.
                  </p>
                </div>
              </div>

              {/* Benefits section */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-xl mb-6 text-center">Why This System Works</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4 group hover:bg-white/50 p-3 rounded-lg transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Quality Content</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">AI creates professional, engaging content that meets high standards.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group hover:bg-white/50 p-3 rounded-lg transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Fair Distribution</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">Time limits ensure content doesn't sit unused while giving fair access.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-4 group hover:bg-white/50 p-3 rounded-lg transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Full Control</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">Once claimed, you own it completely - edit, customize, and use as needed.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group hover:bg-white/50 p-3 rounded-lg transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Resource Efficiency</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">Automatic cleanup prevents database bloat while preserving valuable content.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What happens when you claim */}
              <div className="border border-blue-200 rounded-xl p-6 bg-blue-50/50">
                <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
                  <Crown className="h-6 w-6 text-blue-600" />
                  What Happens When You Claim
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 group hover:bg-white/60 p-3 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 block">Permanent Ownership</span>
                      <span className="text-sm text-gray-600">Content becomes permanently yours - no more expiration timer</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group hover:bg-white/60 p-3 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 block">Full Editorial Control</span>
                      <span className="text-sm text-gray-600">Gain complete access to modify, update, and customize content</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group hover:bg-white/60 p-3 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 block">Deletion Protection</span>
                      <span className="text-sm text-gray-600">Protected from deletion by other users</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group hover:bg-white/60 p-3 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 block">Advanced Features</span>
                      <span className="text-sm text-gray-600">Access to premium SEO tools and detailed analytics</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 group hover:bg-white/60 p-3 rounded-lg transition-colors">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mt-0.5">
                      <XCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 block">Flexible Release</span>
                      <span className="text-sm text-gray-600">Option to unclaim and release back to the community when desired</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Ready to claim this content and make it yours?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {user ? (
                    <Button
                      onClick={() => {
                        setShowSystemExplanation(false);
                        setShowClaimModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Claim This Content
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowSystemExplanation(false);
                        setShowClaimModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Sign In to Claim
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowSystemExplanation(false)}
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Continue Reading
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
      </div>
    </TooltipProvider>
  );
}

export default BeautifulBlogPost;
