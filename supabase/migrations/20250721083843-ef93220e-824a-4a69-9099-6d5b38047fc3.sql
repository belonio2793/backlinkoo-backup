-- Create table for saved ranking targets
CREATE TABLE public.ranking_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  keyword TEXT NOT NULL,
  name TEXT, -- Optional friendly name for the target
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for ranking results history
CREATE TABLE public.ranking_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id UUID NOT NULL REFERENCES public.ranking_targets(id) ON DELETE CASCADE,
  search_engine TEXT NOT NULL,
  position INTEGER, -- NULL if not found
  found BOOLEAN NOT NULL DEFAULT false,
  error_details JSONB, -- Store SSL issues, URL errors, etc.
  backlinks_count INTEGER DEFAULT 0,
  competitor_analysis JSONB, -- Store top 10 competitors
  serp_features JSONB, -- Store SERP features like snippets, images, etc.
  total_results BIGINT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_ranking_targets_user_id ON public.ranking_targets(user_id);
CREATE INDEX idx_ranking_targets_active ON public.ranking_targets(is_active) WHERE is_active = true;
CREATE INDEX idx_ranking_results_target_id ON public.ranking_results(target_id);
CREATE INDEX idx_ranking_results_checked_at ON public.ranking_results(checked_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ranking_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ranking_targets
CREATE POLICY "Users can view their own ranking targets"
  ON public.ranking_targets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ranking targets"
  ON public.ranking_targets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ranking targets"
  ON public.ranking_targets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ranking targets"
  ON public.ranking_targets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for ranking_results  
CREATE POLICY "Users can view results for their ranking targets"
  ON public.ranking_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ranking_targets rt 
      WHERE rt.id = ranking_results.target_id 
      AND rt.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert ranking results"
  ON public.ranking_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ranking_targets rt 
      WHERE rt.id = ranking_results.target_id 
      AND rt.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE TRIGGER update_ranking_targets_updated_at
  BEFORE UPDATE ON public.ranking_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create view for latest ranking results
CREATE VIEW public.ranking_dashboard AS
SELECT 
  rt.id as target_id,
  rt.user_id,
  rt.url,
  rt.domain,
  rt.keyword,
  rt.name,
  rt.is_active,
  rt.created_at as target_created_at,
  rt.updated_at as target_updated_at,
  -- Google results
  google.position as google_position,
  google.found as google_found,
  google.checked_at as google_checked_at,
  google.backlinks_count as google_backlinks,
  -- Overall metrics
  COALESCE(google.position, 999) as best_position,
  COALESCE(google.position, 0) as average_position
FROM public.ranking_targets rt
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (target_id) 
    position, found, checked_at, backlinks_count, error_details
  FROM public.ranking_results 
  WHERE target_id = rt.id AND search_engine = 'google'
  ORDER BY target_id, checked_at DESC
) google ON true
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (target_id)
    position, found, checked_at, backlinks_count, error_details
  FROM public.ranking_results 
  WHERE target_id = rt.id AND search_engine = 'bing'
  ORDER BY target_id, checked_at DESC  
) bing ON true
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (target_id)
    position, found, checked_at, backlinks_count, error_details
  FROM public.ranking_results 
  WHERE target_id = rt.id AND search_engine = 'yahoo'
  ORDER BY target_id, checked_at DESC
) yahoo ON true
WHERE rt.is_active = true;
