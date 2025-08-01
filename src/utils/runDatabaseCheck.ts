import { blogSystemDiagnostic } from './blogSystemDiagnostic';
import { supabase } from '@/integrations/supabase/client';

// Immediate database check with detailed results
export async function runDatabaseCheck() {
  console.log('🔍 Running comprehensive database check...');
  
  const results = {
    connectionTest: null as any,
    quickStatus: null as any,
    fullDiagnostic: null as any,
    missingComponents: [] as string[],
    sqlCommands: [] as string[]
  };

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing Supabase connection...');
    try {
      const { data, error } = await supabase.from('blog_posts').select('count', { count: 'exact', head: true });
      results.connectionTest = {
        success: !error,
        error: error?.message,
        message: error ? 'Failed to connect to database' : 'Database connection successful'
      };
    } catch (err: any) {
      results.connectionTest = {
        success: false,
        error: err.message,
        message: 'Critical: Cannot connect to Supabase'
      };
    }

    // Test 2: Quick status
    console.log('2️⃣ Running quick status check...');
    results.quickStatus = await blogSystemDiagnostic.getQuickStatus();

    // Test 3: Full diagnostic
    console.log('3️⃣ Running full diagnostic...');
    results.fullDiagnostic = await blogSystemDiagnostic.runFullDiagnostic();

    // Analyze missing components
    const diagnostic = results.fullDiagnostic;
    
    // Check for missing user_saved_posts table
    const userSavedTable = diagnostic.tables.find((t: any) => t.name === 'user_saved_posts');
    if (!userSavedTable || !userSavedTable.exists) {
      results.missingComponents.push('user_saved_posts table');
      results.sqlCommands.push(`
-- Create user_saved_posts table
CREATE TABLE user_saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Add indexes for performance
CREATE INDEX idx_user_saved_posts_user_id ON user_saved_posts(user_id);
CREATE INDEX idx_user_saved_posts_post_id ON user_saved_posts(post_id);
CREATE INDEX idx_user_saved_posts_saved_at ON user_saved_posts(saved_at);

-- Enable Row Level Security
ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own saved posts" ON user_saved_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save their own posts" ON user_saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved posts" ON user_saved_posts
  FOR DELETE USING (auth.uid() = user_id);`);
    }

    // Check for missing profiles columns
    const profilesTable = diagnostic.tables.find((t: any) => t.name === 'profiles');
    if (profilesTable && profilesTable.exists) {
      // Check if subscription_tier column exists
      if (profilesTable.columns && !profilesTable.columns.includes('subscription_tier')) {
        results.missingComponents.push('profiles.subscription_tier column');
        results.sqlCommands.push(`
-- Add subscription_tier column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT CHECK (subscription_tier IN ('free', 'monthly', 'premium'));`);
      }
    }

    // Check for missing database functions
    const slugFunction = diagnostic.functions.find((f: any) => f.name === 'generate_unique_slug');
    if (!slugFunction || !slugFunction.exists) {
      results.missingComponents.push('generate_unique_slug function');
      results.sqlCommands.push(`
-- Create function to generate unique slugs
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
$$ LANGUAGE plpgsql;`);
    }

    const viewFunction = diagnostic.functions.find((f: any) => f.name === 'increment_blog_post_views');
    if (!viewFunction || !viewFunction.exists) {
      results.missingComponents.push('increment_blog_post_views function');
      results.sqlCommands.push(`
-- Create function to increment blog post views
CREATE OR REPLACE FUNCTION increment_blog_post_views(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts 
  SET view_count = view_count + 1, updated_at = NOW()
  WHERE slug = post_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql;`);
    }

    // Display results
    console.log('\n📊 DATABASE DIAGNOSTIC RESULTS');
    console.log('================================');
    
    console.log('\n🔌 Connection Test:');
    console.log(results.connectionTest.success ? '✅' : '❌', results.connectionTest.message);
    if (results.connectionTest.error) {
      console.error('Error:', results.connectionTest.error);
    }

    console.log('\n⚡ Quick Status:');
    console.table(results.quickStatus);

    console.log('\n📋 Tables Status:');
    diagnostic.tables.forEach((table: any) => {
      const status = table.exists ? '✅' : '❌';
      const required = table.required ? '(Required)' : '(Optional)';
      console.log(`${status} ${table.name} ${required}`, {
        exists: table.exists,
        rowCount: table.rowCount,
        issues: table.issues?.length || 0
      });
    });

    console.log('\n🔧 Functions Status:');
    diagnostic.functions.forEach((func: any) => {
      const status = func.exists ? '✅' : '❌';
      console.log(`${status} ${func.name}`, func.required ? '(Required)' : '(Optional)');
    });

    console.log('\n📈 Overall Status:', diagnostic.overall.status.toUpperCase());
    console.log('Summary:', diagnostic.overall.summary);

    if (results.missingComponents.length > 0) {
      console.log('\n⚠️ MISSING COMPONENTS:');
      results.missingComponents.forEach((component, i) => {
        console.log(`${i + 1}. ${component}`);
      });

      console.log('\n🛠️ SQL COMMANDS TO FIX ISSUES:');
      console.log('Copy and paste these commands into your Supabase SQL Editor:');
      console.log('='.repeat(60));
      results.sqlCommands.forEach((command, i) => {
        console.log(`\n-- Command ${i + 1}: ${results.missingComponents[i]}`);
        console.log(command);
      });
    } else {
      console.log('\n✅ All required components are properly configured!');
    }

    return results;

  } catch (error: any) {
    console.error('❌ Diagnostic failed:', error);
    results.connectionTest = {
      success: false,
      error: error.message,
      message: 'Diagnostic process failed'
    };
    return results;
  }
}

// Auto-run the check
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('🔄 Auto-running database check...');
  setTimeout(() => {
    runDatabaseCheck().then(results => {
      // Make results available globally for inspection
      (window as any).databaseCheckResults = results;
    });
  }, 3000);
  
  // Make function available globally
  (window as any).runDatabaseCheck = runDatabaseCheck;
}
