-- Enable real-time updates for the actual tables that feed the ranking dashboard
ALTER TABLE public.ranking_targets REPLICA IDENTITY FULL;
ALTER TABLE public.ranking_results REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_targets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_results;