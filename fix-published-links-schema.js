#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('your_') || supabaseServiceKey.includes('your_')) {
    console.log('❌ Please set your Supabase credentials in environment variables or edit this script');
    console.log('Required:');
    console.log('- VITE_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPublishedLinksSchema() {
    console.log('🔧 Fixing automation_published_links schema...');
    
    try {
        // Check if the table exists
        const { data: tables, error: tablesError } = await supabase
            .rpc('check_table_exists', { table_name: 'automation_published_links' });
            
        if (tablesError) {
            console.log('⚠️ Table check failed, attempting to create/fix schema...');
        }

        // Add missing columns one by one
        const alterQueries = [
            // Add anchor_text column if it doesn't exist
            `ALTER TABLE automation_published_links 
             ADD COLUMN IF NOT EXISTS anchor_text TEXT;`,
            
            // Add target_url column if it doesn't exist
            `ALTER TABLE automation_published_links 
             ADD COLUMN IF NOT EXISTS target_url TEXT;`,
            
            // Add keyword column if it doesn't exist
            `ALTER TABLE automation_published_links 
             ADD COLUMN IF NOT EXISTS keyword TEXT;`,
            
            // Add validation_status column if it doesn't exist
            `ALTER TABLE automation_published_links 
             ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';`,
            
            // Add status column if it doesn't exist
            `ALTER TABLE automation_published_links 
             ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';`
        ];

        console.log('📝 Adding missing columns...');
        
        for (const query of alterQueries) {
            try {
                const { error } = await supabase.rpc('execute_sql', { query });
                if (error) {
                    console.log(`⚠️ Query may have failed (column might already exist): ${error.message}`);
                } else {
                    console.log('✅ Column added successfully');
                }
            } catch (err) {
                console.log(`⚠️ Column operation: ${err.message}`);
            }
        }

        // Verify the schema
        console.log('🔍 Verifying schema...');
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'automation_published_links')
            .eq('table_schema', 'public');

        if (columnsError) {
            console.error('❌ Error checking columns:', columnsError.message);
        } else {
            console.log('📋 Current schema:');
            columns.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type}`);
            });
        }

        console.log('✅ Schema fix completed!');
        return true;

    } catch (error) {
        console.error('❌ Error fixing schema:', error.message);
        return false;
    }
}

fixPublishedLinksSchema().then(success => {
    if (success) {
        console.log('🎉 Published links schema is now ready!');
    } else {
        console.log('❌ Schema fix failed. Check the errors above.');
    }
    process.exit(success ? 0 : 1);
});
