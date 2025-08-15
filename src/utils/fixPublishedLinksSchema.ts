/**
 * Utility to fix the missing published_at column in automation_published_links table
 * This addresses the issue where published links aren't being saved due to missing column
 */

import { supabase } from '@/integrations/supabase/client';

export async function fixPublishedLinksSchema(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Checking automation_published_links table schema...');
    
    // Check if published_at column exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'automation_published_links')
      .eq('table_schema', 'public')
      .eq('column_name', 'published_at');

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError);
      return {
        success: false,
        message: `Failed to check table schema: ${columnsError.message}`
      };
    }

    if (!columns || columns.length === 0) {
      console.log('⚠️ published_at column missing. Adding it now...');
      
      // Add the missing column using RPC function
      const { error: addColumnError } = await supabase.rpc('exec_sql', {
        query: `
          ALTER TABLE automation_published_links 
          ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();
          
          CREATE INDEX IF NOT EXISTS idx_automation_published_links_published_at 
          ON automation_published_links(published_at DESC);
          
          UPDATE automation_published_links 
          SET published_at = created_at 
          WHERE published_at IS NULL;
        `
      });

      if (addColumnError) {
        console.error('❌ Error adding column:', addColumnError);
        return {
          success: false,
          message: `Failed to add published_at column: ${addColumnError.message}`
        };
      }

      console.log('✅ published_at column added successfully');
      return {
        success: true,
        message: 'Schema fixed: published_at column added to automation_published_links table'
      };
    } else {
      console.log('✅ published_at column already exists');
      return {
        success: true,
        message: 'Schema is correct: published_at column exists'
      };
    }
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    return {
      success: false,
      message: `Schema fix failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function testPublishedLinksInsert(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧪 Testing published links insert...');
    
    // Try to insert a test record
    const testData = {
      campaign_id: '00000000-0000-0000-0000-000000000001', // Dummy UUID for test
      published_url: 'https://test.example.com',
      anchor_text: 'test link',
      target_url: 'https://target.example.com',
      platform: 'test',
      status: 'test',
      published_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('automation_published_links')
      .insert(testData);

    if (insertError) {
      if (insertError.message.includes('violates foreign key constraint')) {
        // Expected error due to dummy campaign_id, but column exists
        return {
          success: true,
          message: 'Schema test passed: published_at column accepts data (foreign key error is expected)'
        };
      } else {
        return {
          success: false,
          message: `Insert test failed: ${insertError.message}`
        };
      }
    }

    // Clean up test record if it was inserted
    await supabase
      .from('automation_published_links')
      .delete()
      .eq('platform', 'test')
      .eq('status', 'test');

    return {
      success: true,
      message: 'Schema test passed: published_at column works correctly'
    };
  } catch (error) {
    return {
      success: false,
      message: `Insert test failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
