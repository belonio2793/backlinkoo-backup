import { supabase } from '@/integrations/supabase/client';

export class RLSStatusService {
  /**
   * Test if RLS is blocking blog post creation
   */
  static async testRLSStatus(): Promise<{ 
    isBlocked: boolean; 
    error?: string; 
    canRead: boolean;
    canCreate: boolean;
  }> {
    console.log('🔍 Testing RLS status...');
    
    let canRead = false;
    let canCreate = false;
    let isBlocked = false;
    let error = '';

    // Test reading
    try {
      const { data, error: readError } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);
      
      canRead = !readError;
      if (readError) {
        console.log('Read test failed:', readError.message);
      }
    } catch (err) {
      console.log('Read test exception:', err);
    }

    // Test creating
    try {
      const testSlug = `rls-test-${Date.now()}`;
      const { data, error: createError } = await supabase
        .from('blog_posts')
        .insert({
          title: 'RLS Test Post',
          slug: testSlug,
          content: '<p>Testing RLS</p>',
          target_url: 'https://example.com',
          status: 'published',
          is_trial_post: true,
          claimed: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        if (createError.message.includes('row-level security') || 
            createError.message.includes('policy')) {
          isBlocked = true;
          error = createError.message;
        }
        canCreate = false;
      } else {
        canCreate = true;
        // Clean up test post
        if (data) {
          await supabase.from('blog_posts').delete().eq('id', data.id);
        }
      }
    } catch (err: any) {
      isBlocked = true;
      canCreate = false;
      error = err.message;
    }

    return { isBlocked, error, canRead, canCreate };
  }

  /**
   * Get manual SQL commands to fix RLS
   */
  static getManualFixCommands(): string[] {
    return [
      '-- Execute these commands in your Supabase SQL Editor:',
      '',
      '-- 1. Disable Row Level Security',
      'ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;',
      '',
      '-- 2. Grant permissions to public',
      'GRANT ALL PRIVILEGES ON TABLE blog_posts TO PUBLIC;',
      '',
      '-- 3. Grant permissions to anonymous users',
      'GRANT ALL PRIVILEGES ON TABLE blog_posts TO anon;',
      '',
      '-- 4. Grant permissions to authenticated users', 
      'GRANT ALL PRIVILEGES ON TABLE blog_posts TO authenticated;',
      '',
      '-- 5. Grant sequence permissions',
      'GRANT ALL ON SEQUENCE blog_posts_id_seq TO PUBLIC;',
      'GRANT ALL ON SEQUENCE blog_posts_id_seq TO anon;',
      'GRANT ALL ON SEQUENCE blog_posts_id_seq TO authenticated;',
      '',
      '-- 6. Test that it works',
      'INSERT INTO blog_posts (title, slug, content, status, created_at)',
      'VALUES (\'Test Post\', \'test-\' || extract(epoch from now()), \'<p>Test</p>\', \'published\', now());',
      '',
      '-- 7. Clean up test',
      'DELETE FROM blog_posts WHERE title = \'Test Post\';'
    ];
  }

  /**
   * Display RLS status and manual fix instructions
   */
  static async displayRLSStatusAndFix(): Promise<void> {
    const status = await this.testRLSStatus();
    
    console.log('🔍 RLS Status Report:');
    console.log('Can Read Posts:', status.canRead ? '✅' : '❌');
    console.log('Can Create Posts:', status.canCreate ? '✅' : '❌');
    console.log('RLS Blocking:', status.isBlocked ? '🚨 YES' : '✅ NO');
    
    if (status.isBlocked) {
      console.log('');
      console.log('🚨 RLS IS BLOCKING BLOG POST CREATION');
      console.log('');
      console.log('📋 MANUAL FIX REQUIRED:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Open the SQL Editor');
      console.log('3. Copy and paste these commands:');
      console.log('');
      
      const commands = this.getManualFixCommands();
      commands.forEach(cmd => console.log(cmd));
      
      console.log('');
      console.log('4. Execute the commands');
      console.log('5. Refresh this page to test again');
    } else {
      console.log('✅ RLS is not blocking - blog creation should work!');
    }
  }
}

// Auto-display status when module loads - DISABLED TO PREVENT AUTO TEST POSTS
// RLSStatusService.displayRLSStatusAndFix();

// To manually test RLS status, call: RLSStatusService.displayRLSStatusAndFix()

export default RLSStatusService;
