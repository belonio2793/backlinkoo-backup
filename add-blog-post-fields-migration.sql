-- Migration: Add blog post fields to backlink_campaigns table
-- This migration adds fields to link campaigns with their generated blog posts

-- Add blog post fields to campaigns table if they don't exist
ALTER TABLE backlink_campaigns 
ADD COLUMN IF NOT EXISTS blog_post_id UUID,
ADD COLUMN IF NOT EXISTS blog_post_url TEXT,
ADD COLUMN IF NOT EXISTS blog_post_title TEXT,
ADD COLUMN IF NOT EXISTS blog_generated_at TIMESTAMPTZ;

-- Create campaign_blog_links table for additional tracking if it doesn't exist
CREATE TABLE IF NOT EXISTS campaign_blog_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES backlink_campaigns(id) ON DELETE CASCADE,
    blog_post_id UUID NOT NULL,
    blog_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_blog_links_campaign_id ON campaign_blog_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_blog_links_blog_post_id ON campaign_blog_links(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_backlink_campaigns_blog_post_id ON backlink_campaigns(blog_post_id);

-- Add comments for documentation
COMMENT ON COLUMN backlink_campaigns.blog_post_id IS 'Reference to the generated blog post for this campaign';
COMMENT ON COLUMN backlink_campaigns.blog_post_url IS 'URL of the published blog post (backlinkoo.com/{slug})';
COMMENT ON COLUMN backlink_campaigns.blog_post_title IS 'Title of the generated blog post';
COMMENT ON COLUMN backlink_campaigns.blog_generated_at IS 'Timestamp when the blog post was generated';

COMMENT ON TABLE campaign_blog_links IS 'Links between campaigns and their generated blog posts for additional tracking';
