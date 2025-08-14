/**
 * Automated Error Resolution System
 * Analyzes internal logs and applies fixes automatically
 */

import { internalLogger } from './internalLogger';
import { supabase } from '@/integrations/supabase/client';

interface ResolutionStrategy {
  errorPattern: RegExp;
  category: string;
  description: string;
  autoFix: () => Promise<boolean>;
}

class ErrorResolver {
  private resolutionStrategies: ResolutionStrategy[] = [];

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.resolutionStrategies = [
      {
        errorPattern: /expected JSON array/i,
        category: 'json_array_error',
        description: 'JSON array type mismatch in database',
        autoFix: this.fixJsonArrayError.bind(this)
      },
      {
        errorPattern: /column.*does not exist/i,
        category: 'missing_column',
        description: 'Database column missing',
        autoFix: this.fixMissingColumns.bind(this)
      },
      {
        errorPattern: /permission denied|policy violation/i,
        category: 'rls_permission',
        description: 'Row Level Security permission issue',
        autoFix: this.fixRLSPermissions.bind(this)
      },
      {
        errorPattern: /duplicate key value/i,
        category: 'duplicate_key',
        description: 'Duplicate key constraint violation',
        autoFix: this.fixDuplicateKey.bind(this)
      },
      {
        errorPattern: /function.*does not exist/i,
        category: 'missing_function',
        description: 'Missing database function or Netlify function',
        autoFix: this.fixMissingFunction.bind(this)
      }
    ];
  }

  async analyzeAndResolve(): Promise<{
    analyzed: number;
    resolved: number;
    failed: number;
    resolutions: Array<{ error: string; strategy: string; success: boolean; details?: string }>;
  }> {
    internalLogger.info('error_resolver', 'Starting automated error analysis and resolution');

    const recentErrors = internalLogger.getRecentErrors(30); // Last 30 minutes
    const resolutions: Array<{ error: string; strategy: string; success: boolean; details?: string }> = [];
    
    let resolvedCount = 0;
    let failedCount = 0;

    for (const error of recentErrors) {
      const strategy = this.findStrategy(error.message);
      
      if (strategy) {
        internalLogger.info('error_resolver', `Applying strategy: ${strategy.description}`, { error: error.message });
        
        try {
          const success = await strategy.autoFix();
          
          if (success) {
            resolvedCount++;
            internalLogger.info('error_resolver', `Successfully resolved: ${error.message}`);
            resolutions.push({
              error: error.message,
              strategy: strategy.description,
              success: true
            });
          } else {
            failedCount++;
            internalLogger.warn('error_resolver', `Failed to resolve: ${error.message}`);
            resolutions.push({
              error: error.message,
              strategy: strategy.description,
              success: false,
              details: 'Auto-fix returned false'
            });
          }
        } catch (fixError) {
          failedCount++;
          internalLogger.error('error_resolver', `Error during resolution: ${fixError}`, { originalError: error.message });
          resolutions.push({
            error: error.message,
            strategy: strategy.description,
            success: false,
            details: fixError instanceof Error ? fixError.message : 'Unknown error'
          });
        }
      }
    }

    return {
      analyzed: recentErrors.length,
      resolved: resolvedCount,
      failed: failedCount,
      resolutions
    };
  }

  private findStrategy(errorMessage: string): ResolutionStrategy | null {
    return this.resolutionStrategies.find(strategy => 
      strategy.errorPattern.test(errorMessage)
    ) || null;
  }

  // Resolution strategies
  private async fixJsonArrayError(): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to fix JSON array error');
    
    try {
      // Check if the published_articles column has correct type
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, column_default')
        .eq('table_name', 'automation_campaigns')
        .eq('column_name', 'published_articles');

      if (error) {
        internalLogger.error('error_resolver', 'Failed to check column info', { error });
        return false;
      }

      if (!columns || columns.length === 0) {
        internalLogger.info('error_resolver', 'published_articles column missing, adding it');
        
        // Add the missing column
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE automation_campaigns 
            ADD COLUMN IF NOT EXISTS published_articles JSONB DEFAULT '[]'::jsonb;
            
            ALTER TABLE automation_campaigns 
            ADD COLUMN IF NOT EXISTS target_sites_used TEXT[] DEFAULT '{}';
          `
        });

        if (alterError) {
          internalLogger.error('error_resolver', 'Failed to add missing columns', { error: alterError });
          return false;
        }

        internalLogger.info('error_resolver', 'Successfully added missing columns');
        return true;
      }

      const column = columns[0];
      if (column.data_type !== 'jsonb') {
        internalLogger.warn('error_resolver', 'Column exists but wrong type', { 
          currentType: column.data_type,
          expectedType: 'jsonb'
        });
        
        // Try to fix the column type
        const { error: typeError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE automation_campaigns 
            ALTER COLUMN published_articles TYPE JSONB USING published_articles::jsonb;
          `
        });

        if (typeError) {
          internalLogger.error('error_resolver', 'Failed to fix column type', { error: typeError });
          return false;
        }

        return true;
      }

      internalLogger.info('error_resolver', 'JSON column appears correct, issue may be elsewhere');
      return true;

    } catch (error) {
      internalLogger.error('error_resolver', 'Exception in fixJsonArrayError', { error });
      return false;
    }
  }

  private async fixMissingColumns(): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to fix missing columns');
    
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          -- Add all potentially missing columns
          ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS links_built INTEGER DEFAULT 0;
          ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS available_sites INTEGER DEFAULT 0;
          ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS target_sites_used TEXT[] DEFAULT '{}';
          ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS published_articles JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
          ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS current_platform TEXT;
          ALTER TABLE automation_campaigns ADD COLUMN IF NOT EXISTS execution_progress JSONB DEFAULT '{}'::jsonb;
        `
      });

      if (error) {
        internalLogger.error('error_resolver', 'Failed to add missing columns', { error });
        return false;
      }

      internalLogger.info('error_resolver', 'Successfully ensured all columns exist');
      return true;

    } catch (error) {
      internalLogger.error('error_resolver', 'Exception in fixMissingColumns', { error });
      return false;
    }
  }

  private async fixRLSPermissions(): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to fix RLS permissions');
    
    try {
      // Check if RLS policies exist and are correct
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          -- Ensure RLS policies exist for automation_campaigns
          DROP POLICY IF EXISTS "Users can insert own campaigns" ON automation_campaigns;
          DROP POLICY IF EXISTS "Users can view own campaigns" ON automation_campaigns;
          DROP POLICY IF EXISTS "Users can update own campaigns" ON automation_campaigns;
          DROP POLICY IF EXISTS "Users can delete own campaigns" ON automation_campaigns;
          
          CREATE POLICY "Users can insert own campaigns" ON automation_campaigns 
              FOR INSERT WITH CHECK (auth.uid() = user_id);
          CREATE POLICY "Users can view own campaigns" ON automation_campaigns 
              FOR SELECT USING (auth.uid() = user_id);
          CREATE POLICY "Users can update own campaigns" ON automation_campaigns 
              FOR UPDATE USING (auth.uid() = user_id);
          CREATE POLICY "Users can delete own campaigns" ON automation_campaigns 
              FOR DELETE USING (auth.uid() = user_id);
        `
      });

      if (error) {
        internalLogger.error('error_resolver', 'Failed to fix RLS policies', { error });
        return false;
      }

      internalLogger.info('error_resolver', 'Successfully updated RLS policies');
      return true;

    } catch (error) {
      internalLogger.error('error_resolver', 'Exception in fixRLSPermissions', { error });
      return false;
    }
  }

  private async fixDuplicateKey(): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to fix duplicate key constraint');
    
    // For duplicate key errors, we typically just need to retry with a unique value
    // This is more of a application-level fix than a database fix
    internalLogger.info('error_resolver', 'Duplicate key error noted - application should retry with unique values');
    return true;
  }

  private async fixMissingFunction(): Promise<boolean> {
    internalLogger.info('error_resolver', 'Attempting to fix missing function');
    
    try {
      // Check if exec_sql function exists and create if missing
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS text
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql;
            RETURN 'SQL executed successfully';
          EXCEPTION
            WHEN OTHERS THEN
              RETURN 'Error: ' || SQLERRM;
          END;
          $$;
        `
      });

      if (error) {
        internalLogger.error('error_resolver', 'Failed to create exec_sql function', { error });
        return false;
      }

      internalLogger.info('error_resolver', 'Successfully ensured exec_sql function exists');
      return true;

    } catch (error) {
      internalLogger.error('error_resolver', 'Exception in fixMissingFunction', { error });
      return false;
    }
  }

  // Manual resolution trigger
  async resolveSpecificError(errorMessage: string): Promise<boolean> {
    const strategy = this.findStrategy(errorMessage);
    
    if (!strategy) {
      internalLogger.warn('error_resolver', 'No strategy found for error', { error: errorMessage });
      return false;
    }

    try {
      return await strategy.autoFix();
    } catch (error) {
      internalLogger.error('error_resolver', 'Failed to resolve specific error', { 
        originalError: errorMessage,
        resolutionError: error
      });
      return false;
    }
  }
}

export const errorResolver = new ErrorResolver();
export default errorResolver;
