import { supabase } from '@/integrations/supabase/client';

export const createWaitlistTable = async () => {
  try {
    // Check if table exists and create if it doesn't
    const { error } = await supabase.rpc('create_waitlist_table_if_not_exists');
    
    if (error) {
      console.warn('Waitlist table creation failed (may already exist):', error);
      return false;
    }
    
    console.log('✅ Waitlist table ready');
    return true;
  } catch (error) {
    console.warn('⚠️ Could not create waitlist table:', error);
    return false;
  }
};

// SQL for creating the table (for reference)
export const WAITLIST_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  source TEXT DEFAULT 'unknown',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'joined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own waitlist entries" ON waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own waitlist entries" ON waitlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all waitlist entries" ON waitlist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
`;
