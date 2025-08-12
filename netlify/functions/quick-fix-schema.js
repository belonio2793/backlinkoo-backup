const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Running quick schema fix...');
    
    const fixes = [];
    
    // Fix 1: Add automation_enabled column to blog_campaigns
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'blog_campaigns' 
                  AND column_name = 'automation_enabled'
              ) THEN
                  ALTER TABLE blog_campaigns ADD COLUMN automation_enabled boolean DEFAULT false;
                  RAISE NOTICE 'Added automation_enabled column to blog_campaigns';
              ELSE
                  RAISE NOTICE 'automation_enabled column already exists';
              END IF;
          EXCEPTION
              WHEN others THEN
                  RAISE NOTICE 'Failed to add automation_enabled column: %', SQLERRM;
          END $$;
        `
      });
      
      if (error) {
        fixes.push({ fix: 'automation_enabled column', status: 'failed', error: error.message });
      } else {
        fixes.push({ fix: 'automation_enabled column', status: 'success' });
      }
    } catch (error) {
      fixes.push({ fix: 'automation_enabled column', status: 'failed', error: error.message });
    }

    // Fix 2: Add updated_at column to blog_campaigns
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'blog_campaigns' 
                  AND column_name = 'updated_at'
              ) THEN
                  ALTER TABLE blog_campaigns ADD COLUMN updated_at timestamptz DEFAULT now();
                  RAISE NOTICE 'Added updated_at column to blog_campaigns';
              ELSE
                  RAISE NOTICE 'updated_at column already exists';
              END IF;
          EXCEPTION
              WHEN others THEN
                  RAISE NOTICE 'Failed to add updated_at column: %', SQLERRM;
          END $$;
        `
      });
      
      if (error) {
        fixes.push({ fix: 'updated_at column', status: 'failed', error: error.message });
      } else {
        fixes.push({ fix: 'updated_at column', status: 'success' });
      }
    } catch (error) {
      fixes.push({ fix: 'updated_at column', status: 'failed', error: error.message });
    }

    // Fix 3: Update blog_comments status constraint
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          DO $$
          BEGIN
              -- Drop existing constraint if it exists
              IF EXISTS (
                  SELECT 1 FROM information_schema.table_constraints 
                  WHERE table_name = 'blog_comments' 
                  AND constraint_name LIKE '%status%check%'
              ) THEN
                  ALTER TABLE blog_comments DROP CONSTRAINT IF EXISTS blog_comments_status_check;
              END IF;
              
              -- Add updated constraint
              ALTER TABLE blog_comments 
              ADD CONSTRAINT blog_comments_status_check 
              CHECK (status IN ('pending', 'approved', 'posted', 'failed', 'processing', 'needs_verification'));
              
              RAISE NOTICE 'Updated blog_comments status constraint';
          EXCEPTION
              WHEN others THEN
                  RAISE NOTICE 'Failed to update status constraint: %', SQLERRM;
          END $$;
        `
      });
      
      if (error) {
        fixes.push({ fix: 'status constraint', status: 'failed', error: error.message });
      } else {
        fixes.push({ fix: 'status constraint', status: 'success' });
      }
    } catch (error) {
      fixes.push({ fix: 'status constraint', status: 'failed', error: error.message });
    }

    const successCount = fixes.filter(f => f.status === 'success').length;
    const totalFixes = fixes.length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Applied ${successCount}/${totalFixes} schema fixes`,
        fixes,
        total_fixes: totalFixes,
        successful_fixes: successCount
      })
    };

  } catch (error) {
    console.error('Quick fix failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Quick schema fix failed'
      })
    };
  }
};
