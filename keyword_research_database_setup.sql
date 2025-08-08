-- ===================================================================
-- KEYWORD RESEARCH & RANKING TRACKER DATABASE SETUP
-- ===================================================================
-- 
-- This script creates the necessary tables for the keyword research 
-- and ranking tracker functionality to work properly.
--
-- ⚠️ IMPORTANT: Run this in your Supabase SQL Editor
-- ===================================================================

-- 1. KEYWORD RESEARCH HISTORY TABLE
-- =================================
-- Stores keyword research results for users to view history

CREATE TABLE IF NOT EXISTS public.keyword_research_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    search_volume INTEGER,
    difficulty INTEGER CHECK (difficulty >= 0 AND difficulty <= 100),
    cpc DECIMAL(8,2),
    trend VARCHAR(20) CHECK (trend IN ('up', 'down', 'stable')),
    competition VARCHAR(20) CHECK (competition IN ('low', 'medium', 'high')),
    confidence VARCHAR(20) CHECK (confidence IN ('high', 'medium', 'low')),
    location VARCHAR(100),
    country_code VARCHAR(3),
    city VARCHAR(100),
    search_engine VARCHAR(50) DEFAULT 'google',
    related_keywords JSONB,
    competitor_count INTEGER,
    top_domains JSONB,
    trends_data JSONB,
    research_method VARCHAR(50) DEFAULT 'free_apis',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. KEYWORD RESEARCH CAMPAIGNS TABLE
-- ===================================
-- Groups related keyword research for project management

CREATE TABLE IF NOT EXISTS public.keyword_research_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_domain VARCHAR(255),
    target_location VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    total_keywords INTEGER DEFAULT 0,
    avg_search_volume INTEGER DEFAULT 0,
    avg_difficulty INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. KEYWORD RESEARCH CAMPAIGN KEYWORDS TABLE
-- ============================================
-- Links keywords to campaigns

CREATE TABLE IF NOT EXISTS public.keyword_research_campaign_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.keyword_research_campaigns(id) ON DELETE CASCADE,
    keyword_research_id UUID REFERENCES public.keyword_research_history(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    notes TEXT,
    target_url VARCHAR(500),
    current_ranking INTEGER,
    target_ranking INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, keyword_research_id)
);

-- 4. SAVED KEYWORD LISTS TABLE
-- =============================
-- Allows users to save and organize keyword lists

CREATE TABLE IF NOT EXISTS public.saved_keyword_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    keywords JSONB NOT NULL, -- Array of keyword objects
    total_keywords INTEGER DEFAULT 0,
    avg_search_volume INTEGER DEFAULT 0,
    avg_difficulty INTEGER DEFAULT 0,
    tags JSONB, -- Array of tags for organization
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- NOTE: RANKING TRACKER TABLES ALREADY EXIST
-- ===================================================================
-- 
-- The following tables are already set up for ranking tracker:
-- - ranking_targets: Stores URL/keyword combinations to track
-- - ranking_results: Stores ranking check results
-- - ranking_dashboard: View combining targets and results
--
-- These tables are working correctly and don't need modification.
-- ===================================================================

-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==================================

-- Keyword research history indexes
CREATE INDEX IF NOT EXISTS idx_keyword_research_history_user_id ON public.keyword_research_history(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_research_history_keyword ON public.keyword_research_history(keyword);
CREATE INDEX IF NOT EXISTS idx_keyword_research_history_created_at ON public.keyword_research_history(created_at);
CREATE INDEX IF NOT EXISTS idx_keyword_research_history_user_keyword ON public.keyword_research_history(user_id, keyword);

-- Campaign indexes
CREATE INDEX IF NOT EXISTS idx_keyword_research_campaigns_user_id ON public.keyword_research_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_research_campaigns_status ON public.keyword_research_campaigns(status);

-- Campaign keywords indexes
CREATE INDEX IF NOT EXISTS idx_keyword_research_campaign_keywords_campaign_id ON public.keyword_research_campaign_keywords(campaign_id);
CREATE INDEX IF NOT EXISTS idx_keyword_research_campaign_keywords_keyword_research_id ON public.keyword_research_campaign_keywords(keyword_research_id);

-- Saved keyword lists indexes
CREATE INDEX IF NOT EXISTS idx_saved_keyword_lists_user_id ON public.saved_keyword_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_keyword_lists_is_public ON public.saved_keyword_lists(is_public);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================

-- Enable RLS on all tables
ALTER TABLE public.keyword_research_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_research_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_research_campaign_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_keyword_lists ENABLE ROW LEVEL SECURITY;

-- Keyword research history policies
CREATE POLICY "Users can view their own keyword research history" ON public.keyword_research_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keyword research history" ON public.keyword_research_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keyword research history" ON public.keyword_research_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keyword research history" ON public.keyword_research_history
    FOR DELETE USING (auth.uid() = user_id);

-- Keyword research campaigns policies
CREATE POLICY "Users can view their own keyword research campaigns" ON public.keyword_research_campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keyword research campaigns" ON public.keyword_research_campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keyword research campaigns" ON public.keyword_research_campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keyword research campaigns" ON public.keyword_research_campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- Campaign keywords policies
CREATE POLICY "Users can view campaign keywords for their campaigns" ON public.keyword_research_campaign_keywords
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.keyword_research_campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert campaign keywords for their campaigns" ON public.keyword_research_campaign_keywords
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.keyword_research_campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update campaign keywords for their campaigns" ON public.keyword_research_campaign_keywords
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.keyword_research_campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete campaign keywords for their campaigns" ON public.keyword_research_campaign_keywords
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.keyword_research_campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

-- Saved keyword lists policies
CREATE POLICY "Users can view their own saved keyword lists" ON public.saved_keyword_lists
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own saved keyword lists" ON public.saved_keyword_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved keyword lists" ON public.saved_keyword_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved keyword lists" ON public.saved_keyword_lists
    FOR DELETE USING (auth.uid() = user_id);

-- 7. TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =========================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers
CREATE TRIGGER update_keyword_research_history_updated_at 
    BEFORE UPDATE ON public.keyword_research_history 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_keyword_research_campaigns_updated_at 
    BEFORE UPDATE ON public.keyword_research_campaigns 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_keyword_research_campaign_keywords_updated_at 
    BEFORE UPDATE ON public.keyword_research_campaign_keywords 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_saved_keyword_lists_updated_at 
    BEFORE UPDATE ON public.saved_keyword_lists 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===================================================================
-- SETUP COMPLETE!
-- ===================================================================
-- 
-- ✅ Your keyword research and ranking tracker functionality now has:
-- 
-- 1. ✅ Keyword Research History Storage
-- 2. ✅ Campaign Management for Keywords  
-- 3. ✅ Saved Keyword Lists
-- 4. ✅ Ranking Tracker Tables (already existed)
-- 5. ✅ Performance Indexes
-- 6. ✅ Security Policies
-- 7. ✅ Auto-updating Timestamps
--
-- 🚀 The tools are now ready to store and retrieve data!
-- ===================================================================
