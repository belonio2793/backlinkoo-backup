-- Add missing RLS policies for automation_published_links
-- Users need to be able to INSERT and UPDATE published links for their campaigns

-- Allow users to insert published links for their campaigns
DROP POLICY IF EXISTS "Users can create published links for their campaigns" ON automation_published_links;
CREATE POLICY "Users can create published links for their campaigns" ON automation_published_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_published_links.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- Allow users to update published links for their campaigns
DROP POLICY IF EXISTS "Users can update published links for their campaigns" ON automation_published_links;
CREATE POLICY "Users can update published links for their campaigns" ON automation_published_links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_published_links.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- Allow users to delete published links for their campaigns (optional, for cleanup)
DROP POLICY IF EXISTS "Users can delete published links for their campaigns" ON automation_published_links;
CREATE POLICY "Users can delete published links for their campaigns" ON automation_published_links
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_published_links.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- Verify the policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'automation_published_links';
    
    RAISE NOTICE '✅ automation_published_links now has % RLS policies', policy_count;
    
    IF policy_count >= 4 THEN
        RAISE NOTICE '✅ All required RLS policies created for automation_published_links!';
    ELSE
        RAISE NOTICE '⚠️ Some RLS policies may be missing for automation_published_links';
    END IF;
END $$;
