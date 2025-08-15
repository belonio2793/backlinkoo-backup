-- Add missing RLS policies for automation_logs
-- Users need to be able to INSERT logs for their campaigns

-- Allow users to insert logs for their campaigns
DROP POLICY IF EXISTS "Users can create logs for their campaigns" ON automation_logs;
CREATE POLICY "Users can create logs for their campaigns" ON automation_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_logs.campaign_id 
            AND automation_campaigns.user_id = auth.uid()
        )
    );

-- Allow users to update logs for their campaigns (optional, for status updates)
DROP POLICY IF EXISTS "Users can update logs for their campaigns" ON automation_logs;
CREATE POLICY "Users can update logs for their campaigns" ON automation_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM automation_campaigns 
            WHERE automation_campaigns.id = automation_logs.campaign_id 
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
    WHERE tablename = 'automation_logs';
    
    RAISE NOTICE '✅ automation_logs now has % RLS policies', policy_count;
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✅ All required RLS policies created for automation_logs!';
    ELSE
        RAISE NOTICE '⚠️ Some RLS policies may be missing for automation_logs';
    END IF;
END $$;
