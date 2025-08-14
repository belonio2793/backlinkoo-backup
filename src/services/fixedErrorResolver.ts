import { createClient } from '@supabase/supabase-js';
import { internalLogger } from './internalLogger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ErrorStrategy {
  errorPattern: RegExp;
  description: string;
  autoFix: () => Promise<boolean>;
}

export class FixedErrorResolver {
  private resolutionStrategies: ErrorStrategy[] = [
    {
      errorPattern: /expected JSON array/i,
      description: 'Fix TEXT to TEXT[] column type mismatch',
      autoFix: this.fixTextArrayError.bind(this)
    },
    {
      errorPattern: /column .* does not exist/i,
      description: 'Add missing columns to automation_campaigns table',
      autoFix: this.fixMissingColumns.bind(this)
    },
    {
      errorPattern: /permission denied|RLS/i,
      description: 'Fix Row Level Security permissions',
      autoFix: this.fixPermissions.bind(this)
    }
  ];

  public async resolveSpecificError(errorMessage: string): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to resolve error', { errorMessage });
    
    const strategy = this.findMatchingStrategy(errorMessage);
    if (!strategy) {
      internalLogger.warn('error_resolver', 'No matching resolution strategy found', { errorMessage });
      return false;
    }

    internalLogger.info('error_resolver', 'Found matching strategy', { 
      description: strategy.description,
      pattern: strategy.errorPattern.toString()
    });

    try {
      const resolved = await strategy.autoFix();
      
      if (resolved) {
        internalLogger.info('error_resolver', 'Error resolved successfully', { 
          strategy: strategy.description 
        });
      } else {
        internalLogger.warn('error_resolver', 'Error resolution failed', { 
          strategy: strategy.description 
        });
      }

      return resolved;
    } catch (error) {
      internalLogger.error('error_resolver', 'Exception during error resolution', { 
        error,
        strategy: strategy.description 
      });
      return false;
    }
  }

  private findMatchingStrategy(errorMessage: string): ErrorStrategy | null {
    return this.resolutionStrategies.find(strategy => 
      strategy.errorPattern.test(errorMessage)
    ) || null;
  }

  private async fixTextArrayError(): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to fix TEXT[] column type mismatch');
    
    try {
      // First, check current schema
      const { data: columns, error: schemaError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'automation_campaigns' 
          AND column_name IN ('keywords', 'anchor_texts', 'target_sites_used');
        `
      });

      if (schemaError) {
        internalLogger.error('error_resolver', 'Failed to check schema', { error: schemaError });
        return false;
      }

      internalLogger.info('error_resolver', 'Current array column schema', { columns });

      // Build SQL statements to fix column types
      const sqlStatements = [];
      
      // Check each critical array column
      const arrayColumns = columns || [];
      
      // Keywords column fix
      const keywordsColumn = arrayColumns.find(c => c.column_name === 'keywords');
      if (!keywordsColumn) {
        sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN keywords TEXT[] DEFAULT \'{}\' NOT NULL;');
      } else if (!keywordsColumn.data_type.includes('ARRAY')) {
        sqlStatements.push(`
          ALTER TABLE automation_campaigns ADD COLUMN keywords_backup TEXT;
          UPDATE automation_campaigns SET keywords_backup = keywords::TEXT WHERE keywords IS NOT NULL;
          ALTER TABLE automation_campaigns DROP COLUMN keywords;
          ALTER TABLE automation_campaigns ADD COLUMN keywords TEXT[] DEFAULT '{}' NOT NULL;
          UPDATE automation_campaigns 
          SET keywords = CASE 
            WHEN keywords_backup IS NULL OR keywords_backup = '' THEN '{}'::TEXT[]
            WHEN keywords_backup LIKE '{%}' THEN keywords_backup::TEXT[]
            ELSE ARRAY[keywords_backup]
          END
          WHERE keywords_backup IS NOT NULL;
          ALTER TABLE automation_campaigns DROP COLUMN keywords_backup;
        `);
      }

      // Anchor texts column fix
      const anchorTextsColumn = arrayColumns.find(c => c.column_name === 'anchor_texts');
      if (!anchorTextsColumn) {
        sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN anchor_texts TEXT[] DEFAULT \'{}\' NOT NULL;');
      } else if (!anchorTextsColumn.data_type.includes('ARRAY')) {
        sqlStatements.push(`
          ALTER TABLE automation_campaigns ADD COLUMN anchor_texts_backup TEXT;
          UPDATE automation_campaigns SET anchor_texts_backup = anchor_texts::TEXT WHERE anchor_texts IS NOT NULL;
          ALTER TABLE automation_campaigns DROP COLUMN anchor_texts;
          ALTER TABLE automation_campaigns ADD COLUMN anchor_texts TEXT[] DEFAULT '{}' NOT NULL;
          UPDATE automation_campaigns 
          SET anchor_texts = CASE 
            WHEN anchor_texts_backup IS NULL OR anchor_texts_backup = '' THEN '{}'::TEXT[]
            WHEN anchor_texts_backup LIKE '{%}' THEN anchor_texts_backup::TEXT[]
            ELSE ARRAY[anchor_texts_backup]
          END
          WHERE anchor_texts_backup IS NOT NULL;
          ALTER TABLE automation_campaigns DROP COLUMN anchor_texts_backup;
        `);
      }

      // Target sites used column fix
      const targetSitesColumn = arrayColumns.find(c => c.column_name === 'target_sites_used');
      if (!targetSitesColumn) {
        sqlStatements.push('ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT \'{}\';');
      } else if (!targetSitesColumn.data_type.includes('ARRAY')) {
        sqlStatements.push(`
          ALTER TABLE automation_campaigns ADD COLUMN target_sites_used_backup TEXT;
          UPDATE automation_campaigns SET target_sites_used_backup = target_sites_used::TEXT WHERE target_sites_used IS NOT NULL;
          ALTER TABLE automation_campaigns DROP COLUMN target_sites_used;
          ALTER TABLE automation_campaigns ADD COLUMN target_sites_used TEXT[] DEFAULT '{}';
          UPDATE automation_campaigns 
          SET target_sites_used = CASE 
            WHEN target_sites_used_backup IS NULL OR target_sites_used_backup = '' THEN '{}'::TEXT[]
            WHEN target_sites_used_backup LIKE '{%}' THEN target_sites_used_backup::TEXT[]
            ELSE ARRAY[target_sites_used_backup]
          END
          WHERE target_sites_used_backup IS NOT NULL;
          ALTER TABLE automation_campaigns DROP COLUMN target_sites_used_backup;
        `);
      }

      if (sqlStatements.length === 0) {
        internalLogger.info('error_resolver', 'Array columns appear to be correct type already');
        return true;
      }

      // Execute the fixes
      internalLogger.info('error_resolver', 'Executing column type fixes', { 
        statementCount: sqlStatements.length 
      });

      for (let i = 0; i < sqlStatements.length; i++) {
        const sql = sqlStatements[i];
        internalLogger.info('error_resolver', `Executing statement ${i + 1}/${sqlStatements.length}`);
        
        const { error: execError } = await supabase.rpc('exec_sql', { query: sql });
        
        if (execError) {
          internalLogger.error('error_resolver', 'Failed to execute column fix', { 
            error: execError,
            statement: sql
          });
          return false;
        }
      }

      // Also ensure other required columns exist
      const additionalColumns = `
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS links_built INTEGER DEFAULT 0;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS available_sites INTEGER DEFAULT 0;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS published_articles JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS current_platform TEXT NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS execution_progress JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;
      `;

      const { error: additionalError } = await supabase.rpc('exec_sql', { 
        query: additionalColumns 
      });

      if (additionalError) {
        internalLogger.warn('error_resolver', 'Some additional columns may already exist', { 
          error: additionalError 
        });
      }

      internalLogger.info('error_resolver', 'Successfully fixed array column types');
      return true;

    } catch (error) {
      internalLogger.error('error_resolver', 'Exception in fixTextArrayError', { error });
      return false;
    }
  }

  private async fixMissingColumns(): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to fix missing columns');
    
    try {
      const sql = `
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS links_built INTEGER DEFAULT 0;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS available_sites INTEGER DEFAULT 0;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS target_sites_used TEXT[] DEFAULT '{}';
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS published_articles JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS current_platform TEXT NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS execution_progress JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS auto_start BOOLEAN DEFAULT false;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS first_started TIMESTAMPTZ NULL;
        ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ NULL;
      `;

      const { error } = await supabase.rpc('exec_sql', { query: sql });

      if (error) {
        internalLogger.error('error_resolver', 'Failed to add missing columns', { error });
        return false;
      }

      internalLogger.info('error_resolver', 'Successfully added missing columns');
      return true;

    } catch (error) {
      internalLogger.error('error_resolver', 'Exception in fixMissingColumns', { error });
      return false;
    }
  }

  private async fixPermissions(): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to fix permissions (limited scope)');
    
    // For now, just log that this needs manual intervention
    internalLogger.warn('error_resolver', 'Permission issues require manual intervention in Supabase dashboard');
    
    return false; // Cannot auto-fix permission issues
  }

  // Test if the fixes worked
  public async testArrayInsertion(): Promise<boolean> {
    try {
      const testData = {
        name: 'TEST_DELETE_ME',
        engine_type: 'web2_platforms',
        user_id: '00000000-0000-0000-0000-000000000000',
        status: 'draft',
        auto_start: false,
        keywords: ['test', 'array'],
        anchor_texts: ['test anchor'],
        target_url: 'https://example.com',
        target_sites_used: [],
        links_built: 0,
        available_sites: 0
      };

      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(testData)
        .select('id')
        .single();

      if (error) {
        internalLogger.error('error_resolver', 'Array test failed', { error });
        return false;
      }

      // Clean up test data
      if (data?.id) {
        await supabase.from('automation_campaigns').delete().eq('id', data.id);
      }

      internalLogger.info('error_resolver', 'Array insertion test passed');
      return true;

    } catch (error) {
      internalLogger.error('error_resolver', 'Array test exception', { error });
      return false;
    }
  }
}

export const fixedErrorResolver = new FixedErrorResolver();
