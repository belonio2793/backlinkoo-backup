import { SafeDiagnostic } from './safeDiagnostic';

// Immediate diagnostic test
export async function runImmediateDiagnostic() {
  console.log('🔍 Running safe blog system diagnostic...');

  try {
    // Get quick status
    console.log('\n⚡ Quick Status Check:');
    const quickStatus = await SafeDiagnostic.getQuickStatus();
    console.table(quickStatus);

    // Run full diagnostic
    console.log('\n🔍 Full Diagnostic:');
    const fullDiagnostic = await SafeDiagnostic.runSafeDiagnostic();
    
    console.table(fullDiagnostic);
    
    console.log('\n📊 Tables Status:');
    fullDiagnostic.tables.forEach(table => {
      const status = table.exists ? '✅' : '❌';
      const required = table.required ? '(Required)' : '(Optional)';
      console.log(`${status} ${table.name} ${required}`, {
        exists: table.exists,
        rowCount: table.rowCount,
        issues: table.issues
      });
    });
    
    console.log('\n🔧 Functions Status:');
    fullDiagnostic.functions.forEach(func => {
      const status = func.exists ? '✅' : '❌';
      console.log(`${status} ${func.name}`, func);
    });
    
    console.log('\n📋 Overall Status:');
    console.log(`Status: ${fullDiagnostic.overall.status.toUpperCase()}`);
    console.log(`Summary: ${fullDiagnostic.overall.summary}`);
    
    if (fullDiagnostic.overall.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      fullDiagnostic.overall.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    // SQL Commands for missing tables
    if (fullDiagnostic.overall.status !== 'healthy') {
      console.log('\n🛠️ SQL Commands to Fix Issues:');
      
      const missingUserSaved = !fullDiagnostic.tables.find(t => t.name === 'user_saved_posts')?.exists;
      
      if (missingUserSaved) {
        console.log('\n📝 Create user_saved_posts table:');
        console.log(`
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

-- Add indexes
CREATE INDEX idx_user_saved_posts_user_id ON user_saved_posts(user_id);
CREATE INDEX idx_user_saved_posts_post_id ON user_saved_posts(post_id);

-- Enable RLS
ALTER TABLE user_saved_posts ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own saved posts" ON user_saved_posts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save their own posts" ON user_saved_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved posts" ON user_saved_posts
  FOR DELETE USING (auth.uid() = user_id);
        `);
      }
    }
    
    return fullDiagnostic;
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return null;
  }
}

// Make diagnostic available globally but don't auto-run to prevent errors
if (typeof window !== 'undefined') {
  (window as any).runBlogSystemDiagnostic = runImmediateDiagnostic;
}
