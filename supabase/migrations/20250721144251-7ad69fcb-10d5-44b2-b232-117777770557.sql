-- Enable real-time updates for ranking dashboard
ALTER TABLE public.ranking_dashboard REPLICA IDENTITY FULL;

-- Add the ranking_dashboard table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ranking_dashboard;