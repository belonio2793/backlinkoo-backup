import { supabase } from '@/integrations/supabase/client';

export async function checkAutomationPostsTable(): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('automation_posts')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return { exists: false };
      }
      return { exists: false, error: error.message };
    }

    return { exists: true };
  } catch (error) {
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function createAutomationPostsTable(): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to create the table using a simple approach
    // Note: This requires the user to have appropriate permissions
    const { error } = await supabase.rpc('create_automation_table');

    if (error) {
      // If RPC doesn't exist or fails, provide instructions
      console.error('Failed to create table via RPC:', error.message);
      return { 
        success: false, 
        error: 'Database table creation requires admin setup. Please contact support or check the setup guide.' 
      };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export const AUTOMATION_TABLE_SQL = `
-- SQL to create automation_posts table
-- Run this in your Supabase SQL editor:

CREATE TABLE IF NOT EXISTS automation_posts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  target_url TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_url TEXT,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_posts_user_id ON automation_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_posts_status ON automation_posts(status);
CREATE INDEX IF NOT EXISTS idx_automation_posts_created_at ON automation_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_posts_platform ON automation_posts(platform);

-- Enable Row Level Security
ALTER TABLE automation_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own automation posts" ON automation_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation posts" ON automation_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation posts" ON automation_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation posts" ON automation_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_automation_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_posts_updated_at
  BEFORE UPDATE ON automation_posts
  FOR EACH ROW EXECUTE FUNCTION update_automation_posts_updated_at();
`;
