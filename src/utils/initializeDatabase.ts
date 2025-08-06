import { supabase } from '@/integrations/supabase/client';

/**
 * Initialize the saved_backlink_reports table if it doesn't exist
 * This is a utility function to create the table structure when migrations aren't available
 */
export async function initializeSavedReportsTable(): Promise<boolean> {
  try {
    // Test if the table exists by trying to select from it
    const { error: testError } = await supabase
      .from('saved_backlink_reports')
      .select('id')
      .limit(1);
    
    if (!testError) {
      console.log('✅ saved_backlink_reports table already exists');
      return true;
    }

    // If table doesn't exist (error code 42P01), create it
    if (testError.code === '42P01') {
      console.log('🔧 Creating saved_backlink_reports table...');
      
      const createTableSQL = `
        -- Create saved_backlink_reports table
        CREATE TABLE IF NOT EXISTS public.saved_backlink_reports (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            keyword VARCHAR(255) NOT NULL,
            anchor_text VARCHAR(255) NOT NULL,
            destination_url TEXT NOT NULL,
            report_data JSONB NOT NULL,
            report_summary JSONB,
            total_urls INTEGER DEFAULT 0,
            verified_backlinks INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_saved_backlink_reports_user_id ON public.saved_backlink_reports(user_id);
        CREATE INDEX IF NOT EXISTS idx_saved_backlink_reports_created_at ON public.saved_backlink_reports(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_saved_backlink_reports_keyword ON public.saved_backlink_reports(keyword);

        -- Enable Row Level Security (RLS)
        ALTER TABLE public.saved_backlink_reports ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view their own saved reports" ON public.saved_backlink_reports
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own saved reports" ON public.saved_backlink_reports
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own saved reports" ON public.saved_backlink_reports
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own saved reports" ON public.saved_backlink_reports
            FOR DELETE USING (auth.uid() = user_id);

        -- Create function to automatically update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_saved_backlink_reports_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = TIMEZONE('utc'::text, NOW());
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger to automatically update updated_at
        CREATE TRIGGER update_saved_backlink_reports_updated_at
            BEFORE UPDATE ON public.saved_backlink_reports
            FOR EACH ROW
            EXECUTE FUNCTION update_saved_backlink_reports_updated_at();
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (createError) {
        console.error('❌ Failed to create table:', createError);
        return false;
      }

      console.log('✅ saved_backlink_reports table created successfully');
      return true;
    }

    console.error('❌ Unexpected error checking table:', testError);
    return false;
  } catch (error) {
    console.error('❌ Failed to initialize table:', error);
    return false;
  }
}

/**
 * Check if the saved_backlink_reports table is properly accessible
 */
export async function checkSavedReportsTableAccess(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('saved_backlink_reports')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('❌ Table access check failed:', error);
    return false;
  }
}
