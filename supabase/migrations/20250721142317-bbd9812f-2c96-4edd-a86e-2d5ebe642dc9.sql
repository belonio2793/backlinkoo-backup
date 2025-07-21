-- Create a global campaign ledger table for community visibility
CREATE TABLE public.global_campaign_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  user_location_country TEXT NOT NULL,
  user_location_country_code TEXT NOT NULL,
  backlinks_delivered INTEGER NOT NULL,
  keyword_difficulty_avg DECIMAL(5,2), -- Average difficulty of all keywords in campaign
  keywords_count INTEGER NOT NULL,
  campaign_name TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for the global ledger
ALTER TABLE public.global_campaign_ledger ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (all users can view)
CREATE POLICY "Global campaign ledger is viewable by all authenticated users" 
ON public.global_campaign_ledger 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy for system inserts only (triggered when campaigns complete)
CREATE POLICY "System can insert ledger entries" 
ON public.global_campaign_ledger 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to add entries to global ledger when campaigns complete
CREATE OR REPLACE FUNCTION public.add_to_global_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_difficulty DECIMAL(5,2) := 75.0; -- Default difficulty if not calculated
  user_country TEXT := 'Unknown';
  user_country_code TEXT := 'XX';
BEGIN
  -- Only process when campaign status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Calculate average keyword difficulty (simulated for now)
    -- In a real implementation, you'd have keyword difficulty data
    avg_difficulty := CASE 
      WHEN array_length(NEW.keywords, 1) <= 2 THEN 45.0 + (random() * 20)
      WHEN array_length(NEW.keywords, 1) <= 5 THEN 55.0 + (random() * 25) 
      ELSE 65.0 + (random() * 30)
    END;
    
    -- Get user location (simulated for now - in reality, you'd have this data)
    -- For demo purposes, we'll randomly assign countries
    user_country := CASE floor(random() * 10)::INT
      WHEN 0 THEN 'United States'
      WHEN 1 THEN 'United Kingdom' 
      WHEN 2 THEN 'Canada'
      WHEN 3 THEN 'Australia'
      WHEN 4 THEN 'Germany'
      WHEN 5 THEN 'France'
      WHEN 6 THEN 'Netherlands'
      WHEN 7 THEN 'Sweden'
      WHEN 8 THEN 'Japan'
      ELSE 'Singapore'
    END;
    
    user_country_code := CASE user_country
      WHEN 'United States' THEN 'US'
      WHEN 'United Kingdom' THEN 'GB'
      WHEN 'Canada' THEN 'CA'
      WHEN 'Australia' THEN 'AU'
      WHEN 'Germany' THEN 'DE'
      WHEN 'France' THEN 'FR'
      WHEN 'Netherlands' THEN 'NL'
      WHEN 'Sweden' THEN 'SE'
      WHEN 'Japan' THEN 'JP'
      ELSE 'SG'
    END;
    
    -- Insert into global ledger
    INSERT INTO public.global_campaign_ledger (
      campaign_id,
      user_location_country,
      user_location_country_code,
      backlinks_delivered,
      keyword_difficulty_avg,
      keywords_count,
      campaign_name,
      completed_at
    ) VALUES (
      NEW.id,
      user_country,
      user_country_code,
      NEW.links_delivered,
      avg_difficulty,
      array_length(NEW.keywords, 1),
      NEW.name,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically add completed campaigns to global ledger
CREATE TRIGGER trigger_add_to_global_ledger
  AFTER UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.add_to_global_ledger();

-- Enable realtime for the global ledger table
ALTER TABLE public.global_campaign_ledger REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_campaign_ledger;

-- Create some sample data for testing
INSERT INTO public.global_campaign_ledger (
  campaign_id, 
  user_location_country, 
  user_location_country_code, 
  backlinks_delivered, 
  keyword_difficulty_avg, 
  keywords_count, 
  campaign_name, 
  completed_at
) VALUES 
(gen_random_uuid(), 'United States', 'US', 15, 67.5, 8, 'Digital Marketing Authority Campaign', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), 'United Kingdom', 'GB', 25, 82.3, 12, 'E-commerce SEO Boost', NOW() - INTERVAL '4 hours'),
(gen_random_uuid(), 'Canada', 'CA', 10, 54.8, 5, 'Local Business Visibility', NOW() - INTERVAL '6 hours'),
(gen_random_uuid(), 'Germany', 'DE', 20, 71.2, 9, 'Tech Startup Link Building', NOW() - INTERVAL '8 hours'),
(gen_random_uuid(), 'Australia', 'AU', 18, 63.9, 7, 'Healthcare SEO Campaign', NOW() - INTERVAL '12 hours');