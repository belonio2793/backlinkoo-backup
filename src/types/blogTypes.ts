/**
 * Simple blog post types for direct OpenAI generation
 */

export interface BlogPost {
  id: string;
  user_id?: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  keywords: string[];
  meta_description: string;
  target_url: string;
  anchor_text: string;
  seo_score: number;
  reading_time: number;
  published_url: string;
  is_trial_post: boolean;
  claimed: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
  word_count?: number;
  tags?: string[];
  category?: string;
  status?: string;
  author_name?: string;
}

export interface GenerationRequest {
  targetUrl: string;
  primaryKeyword: string;
  anchorText?: string;
  wordCount?: number;
}
