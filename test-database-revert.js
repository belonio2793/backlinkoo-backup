#!/usr/bin/env node

/**
 * Test script to revert recent database changes
 * This will call the Netlify function to safely revert database changes
 */

async function revertDatabaseChanges() {
  try {
    console.log('🔄 Starting database revert process...');
    console.log('⚠️  This will revert recent affiliate tables, admin users, and policy changes');
    
    // Call the Netlify function to revert database changes
    const response = await fetch('/.netlify/functions/revert-database-changes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Database revert completed successfully!');
      console.log('📊 Summary:', result.summary);
      
      if (result.results && result.results.length > 0) {
        console.log('\n✅ Successful operations:');
        result.results.forEach(r => console.log(`   ${r}`));
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️  Warnings (expected for non-existent items):');
        result.warnings.forEach(w => console.log(`   ${w}`));
      }

      console.log('\n🎯 What was reverted:');
      console.log('   • Affiliate program tables removed');
      console.log('   • Admin user accounts removed');
      console.log('   • Problematic RLS policies cleaned up');
      console.log('   • Excessive permissions revoked');
      console.log('   • Recursive functions removed');
      console.log('   • Security policies restored to safe defaults');

    } else {
      console.error('❌ Database revert failed:', result.error);
      console.error('   Please check the database manually or try again');
    }

  } catch (error) {
    console.error('❌ Failed to execute revert:', error.message);
    console.log('\n🔧 Alternative options:');
    console.log('   1. Manually execute revert_recent_database_changes.sql in Supabase dashboard');
    console.log('   2. Check if database is accessible');
    console.log('   3. Verify Supabase credentials are set');
  }
}

// Execute the revert
revertDatabaseChanges();
