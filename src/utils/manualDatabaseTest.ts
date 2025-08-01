import { supabase } from '@/integrations/supabase/client';

// Manual database test that runs immediately
async function testDatabaseTables() {
  console.log('🔍 MANUAL DATABASE TABLE CHECK');
  console.log('==============================');

  const results: any = {
    tables: {},
    errors: [],
    sqlCommands: []
  };

  // Test required tables
  const requiredTables = [
    'blog_posts',
    'user_saved_posts', 
    'profiles'
  ];

  for (const tableName of requiredTables) {
    try {
      console.log(`\n📊 Testing table: ${tableName}`);
      
      // Try to count rows
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') {
          // Table does not exist
          results.tables[tableName] = {
            exists: false,
            error: 'Table does not exist',
            rowCount: 0
          };
          results.errors.push(`❌ Table '${tableName}' does not exist`);
          
          if (tableName === 'user_saved_posts') {
            results.sqlCommands.push({
              table: tableName,
              sql: `-- Create ${tableName} table
CREATE TABLE user_saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_user_saved_posts_user_id ON user_saved_posts(user_id);
CREATE INDEX idx_user_saved_posts_post_id ON user_saved_posts(post_id);

ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved posts" ON user_saved_posts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save their own posts" ON user_saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved posts" ON user_saved_posts
  FOR DELETE USING (auth.uid() = user_id);`
            });
          }
        } else {
          results.tables[tableName] = {
            exists: true,
            error: error.message,
            rowCount: 0
          };
          results.errors.push(`⚠️ Table '${tableName}' exists but has error: ${error.message}`);
        }
      } else {
        results.tables[tableName] = {
          exists: true,
          error: null,
          rowCount: count || 0
        };
        console.log(`✅ ${tableName}: ${count || 0} rows`);
      }
    } catch (err: any) {
      results.tables[tableName] = {
        exists: false,
        error: err.message,
        rowCount: 0
      };
      results.errors.push(`❌ Failed to test table '${tableName}': ${err.message}`);
    }
  }

  // Test database functions
  console.log('\n🔧 Testing database functions...');
  
  try {
    const { error } = await supabase.rpc('generate_unique_slug', { base_slug: 'test' });
    if (error && error.code === '42883') {
      results.errors.push('❌ Function generate_unique_slug does not exist');
      results.sqlCommands.push({
        table: 'functions',
        sql: `-- Create generate_unique_slug function
CREATE OR REPLACE FUNCTION generate_unique_slug(base_slug TEXT)
RETURNS TEXT AS $$
DECLARE
  unique_slug TEXT;
  counter INTEGER := 0;
  slug_exists BOOLEAN;
BEGIN
  unique_slug := base_slug;
  LOOP
    SELECT EXISTS(SELECT 1 FROM blog_posts WHERE slug = unique_slug) INTO slug_exists;
    IF NOT slug_exists THEN
      RETURN unique_slug;
    END IF;
    counter := counter + 1;
    unique_slug := base_slug || '-' || counter;
  END LOOP;
END;
$$ LANGUAGE plpgsql;`
      });
    } else {
      console.log('✅ generate_unique_slug function exists');
    }
  } catch (err) {
    console.log('⚠️ Could not test generate_unique_slug function');
  }

  // Display summary
  console.log('\n📋 SUMMARY');
  console.log('==========');
  
  Object.entries(results.tables).forEach(([table, data]: [string, any]) => {
    const status = data.exists ? '✅' : '❌';
    console.log(`${status} ${table}: ${data.exists ? `${data.rowCount} rows` : data.error}`);
  });

  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:');
    results.errors.forEach(error => console.log(error));
  }

  if (results.sqlCommands.length > 0) {
    console.log('\n🛠️ SQL COMMANDS TO FIX ISSUES:');
    console.log('Copy these commands to your Supabase SQL Editor:');
    console.log('='.repeat(50));
    
    results.sqlCommands.forEach((cmd, i) => {
      console.log(`\n-- Fix ${i + 1}: ${cmd.table}`);
      console.log(cmd.sql);
    });
  } else {
    console.log('\n✅ All database tables are properly configured!');
  }

  return results;
}

// Run the test immediately
testDatabaseTables().catch(console.error);

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).testDatabaseTables = testDatabaseTables;
}
