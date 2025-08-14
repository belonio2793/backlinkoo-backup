#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables:');
    console.error('   - SUPABASE_URL (or VITE_SUPABASE_URL)');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkAndFixSchema() {
    console.log('🔍 Checking automation schema...');
    
    try {
        // Check if automation_campaigns table exists
        console.log('1. Checking if automation_campaigns table exists...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'automation_campaigns');

        if (tablesError) {
            console.error('❌ Error checking tables:', tablesError.message);
            return false;
        }

        if (!tables || tables.length === 0) {
            console.log('⚠️ automation_campaigns table not found. Creating schema...');
            await createCompleteSchema();
            return true;
        }

        console.log('✅ automation_campaigns table exists');

        // Check required columns
        console.log('2. Checking required columns...');
        const requiredColumns = [
            'started_at', 'completed_at', 'auto_start', 'keywords', 
            'anchor_texts', 'target_sites_used', 'published_articles',
            'links_built', 'available_sites', 'current_platform',
            'execution_progress'
        ];

        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name')
            .eq('table_name', 'automation_campaigns')
            .eq('table_schema', 'public');

        if (columnsError) {
            console.error('❌ Error checking columns:', columnsError.message);
            return false;
        }

        const existingColumns = columns.map(col => col.column_name);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

        if (missingColumns.length > 0) {
            console.log(`⚠️ Missing columns: ${missingColumns.join(', ')}`);
            await addMissingColumns(missingColumns);
        } else {
            console.log('✅ All required columns exist');
        }

        // Check other automation tables
        console.log('3. Checking other automation tables...');
        const automationTables = [
            'automation_logs',
            'automation_content', 
            'automation_published_links',
            'link_placements',
            'campaign_reports'
        ];

        for (const tableName of automationTables) {
            const { data: tableCheck, error: tableError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .eq('table_name', tableName);

            if (!tableCheck || tableCheck.length === 0) {
                console.log(`⚠️ ${tableName} table missing. Creating...`);
                await createMissingTable(tableName);
            } else {
                console.log(`✅ ${tableName} table exists`);
            }
        }

        console.log('4. Testing table access...');
        const { data: testAccess, error: accessError } = await supabase
            .from('automation_campaigns')
            .select('id')
            .limit(1);

        if (accessError) {
            console.error('❌ Table access test failed:', accessError.message);
            return false;
        }

        console.log('✅ All automation schema checks passed!');
        return true;

    } catch (error) {
        console.error('❌ Schema check failed:', error.message);
        return false;
    }
}

async function createCompleteSchema() {
    console.log('🛠️ Creating complete automation schema...');
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_automation_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Migration file not found:', migrationPath);
        return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    try {
        // Execute the migration in chunks to avoid timeout
        const sqlStatements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`Executing ${sqlStatements.length} SQL statements...`);

        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            if (statement.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', {
                        query: statement + ';'
                    });
                    
                    if (error && !error.message.includes('already exists')) {
                        console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
                    }
                } catch (err) {
                    console.warn(`⚠️ Statement ${i + 1} error:`, err.message);
                }
            }
        }

        console.log('✅ Schema creation completed');
        return true;
    } catch (error) {
        console.error('❌ Schema creation failed:', error.message);
        return false;
    }
}

async function addMissingColumns(missingColumns) {
    console.log('🔧 Adding missing columns...');
    
    const columnDefinitions = {
        'started_at': 'TIMESTAMPTZ',
        'completed_at': 'TIMESTAMPTZ', 
        'auto_start': 'BOOLEAN DEFAULT false',
        'keywords': 'TEXT[] DEFAULT \'{}\'',
        'anchor_texts': 'TEXT[] DEFAULT \'{}\'',
        'target_sites_used': 'TEXT[] DEFAULT \'{}\'',
        'published_articles': 'JSONB DEFAULT \'[]\'::jsonb',
        'links_built': 'INTEGER DEFAULT 0',
        'available_sites': 'INTEGER DEFAULT 0',
        'current_platform': 'TEXT',
        'execution_progress': 'JSONB DEFAULT \'{}\'::jsonb'
    };

    for (const column of missingColumns) {
        const definition = columnDefinitions[column] || 'TEXT';
        const sql = `ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS ${column} ${definition};`;
        
        try {
            const { error } = await supabase.rpc('exec_sql', { query: sql });
            if (error) {
                console.warn(`⚠️ Error adding column ${column}:`, error.message);
            } else {
                console.log(`✅ Added column: ${column}`);
            }
        } catch (err) {
            console.warn(`⚠️ Failed to add column ${column}:`, err.message);
        }
    }
}

async function createMissingTable(tableName) {
    const tableDefinitions = {
        'automation_logs': `
            CREATE TABLE automation_logs (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
                level TEXT DEFAULT 'info',
                message TEXT NOT NULL,
                details JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `,
        'automation_content': `
            CREATE TABLE automation_content (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                target_keyword TEXT,
                anchor_text TEXT,
                backlink_url TEXT,
                platform TEXT DEFAULT 'telegraph',
                published_url TEXT,
                status TEXT DEFAULT 'draft',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                published_at TIMESTAMPTZ
            );
        `,
        'automation_published_links': `
            CREATE TABLE automation_published_links (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
                content_id UUID REFERENCES automation_content(id) ON DELETE SET NULL,
                published_url TEXT NOT NULL,
                anchor_text TEXT,
                target_url TEXT,
                platform TEXT DEFAULT 'telegraph',
                status TEXT DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_checked TIMESTAMPTZ DEFAULT NOW()
            );
        `,
        'link_placements': `
            CREATE TABLE link_placements (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
                content_id UUID REFERENCES automation_content(id) ON DELETE SET NULL,
                site_url TEXT NOT NULL,
                page_url TEXT NOT NULL,
                anchor_text TEXT NOT NULL,
                target_url TEXT NOT NULL,
                placement_type TEXT DEFAULT 'contextual',
                position_in_content INTEGER,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `,
        'campaign_reports': `
            CREATE TABLE campaign_reports (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                campaign_id UUID REFERENCES automation_campaigns(id) ON DELETE CASCADE,
                report_date DATE DEFAULT CURRENT_DATE,
                links_built INTEGER DEFAULT 0,
                content_pieces INTEGER DEFAULT 0,
                active_links INTEGER DEFAULT 0,
                click_through_rate DECIMAL(5,4) DEFAULT 0,
                total_clicks INTEGER DEFAULT 0,
                domain_authority_avg DECIMAL(5,2) DEFAULT 0,
                performance_score DECIMAL(5,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `
    };

    const sql = tableDefinitions[tableName];
    if (!sql) {
        console.warn(`⚠️ No definition found for table: ${tableName}`);
        return;
    }

    try {
        const { error } = await supabase.rpc('exec_sql', { query: sql });
        if (error) {
            console.warn(`⚠️ Error creating table ${tableName}:`, error.message);
        } else {
            console.log(`✅ Created table: ${tableName}`);
        }
    } catch (err) {
        console.warn(`⚠️ Failed to create table ${tableName}:`, err.message);
    }
}

// Run if called directly
if (require.main === module) {
    checkAndFixSchema()
        .then(success => {
            if (success) {
                console.log('\n🎉 Automation schema is ready!');
                process.exit(0);
            } else {
                console.log('\n❌ Schema setup failed');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { checkAndFixSchema };
