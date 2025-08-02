import { supabase } from '@/integrations/supabase/client';

export interface ConfigurationAuditResult {
  success: boolean;
  issues: ConfigurationIssue[];
  recommendations: string[];
  schemaInfo: SchemaInfo;
}

export interface ConfigurationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'database' | 'types' | 'environment' | 'rls' | 'functions';
  description: string;
  solution?: string;
}

export interface SchemaInfo {
  tablesAccessible: Record<string, boolean>;
  roleSystemType: 'profiles_role' | 'user_roles_table' | 'mixed' | 'unknown';
  enumsFound: string[];
  triggersFound: string[];
}

export class ConfigurationAudit {
  
  static async performAudit(): Promise<ConfigurationAuditResult> {
    const issues: ConfigurationIssue[] = [];
    const recommendations: string[] = [];
    
    console.log('🔍 Starting comprehensive configuration audit...');

    try {
      // 1. Check Environment Variables
      const envIssues = this.checkEnvironmentVariables();
      issues.push(...envIssues);

      // 2. Check Database Schema
      const schemaInfo = await this.checkDatabaseSchema();
      const schemaIssues = this.analyzeSchemaIssues(schemaInfo);
      issues.push(...schemaIssues);

      // 3. Check Role System Consistency
      const roleIssues = await this.checkRoleSystemConsistency(schemaInfo);
      issues.push(...roleIssues);

      // 4. Check RLS Policies
      const rlsIssues = await this.checkRLSPolicies();
      issues.push(...rlsIssues);

      // 5. Check Functions and Triggers
      const functionIssues = await this.checkFunctionsAndTriggers();
      issues.push(...functionIssues);

      // 6. Generate Recommendations
      const auditRecommendations = this.generateRecommendations(issues, schemaInfo);
      recommendations.push(...auditRecommendations);

      return {
        success: issues.filter(i => i.severity === 'critical').length === 0,
        issues,
        recommendations,
        schemaInfo
      };

    } catch (error: any) {
      issues.push({
        severity: 'critical',
        category: 'database',
        description: `Audit failed: ${error.message}`,
        solution: 'Check database connection and credentials'
      });

      return {
        success: false,
        issues,
        recommendations: ['Fix database connection before proceeding'],
        schemaInfo: {
          tablesAccessible: {},
          roleSystemType: 'unknown',
          enumsFound: [],
          triggersFound: []
        }
      };
    }
  }

  private static checkEnvironmentVariables(): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    // Check Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      issues.push({
        severity: 'critical',
        category: 'environment',
        description: 'VITE_SUPABASE_URL is missing',
        solution: 'Add VITE_SUPABASE_URL to your .env file'
      });
    } else if (!supabaseUrl.includes('.supabase.co')) {
      issues.push({
        severity: 'warning',
        category: 'environment',
        description: 'VITE_SUPABASE_URL may be invalid',
        solution: 'Verify the URL is correct in your Supabase dashboard'
      });
    }

    // Check Supabase Anon Key
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!anonKey) {
      issues.push({
        severity: 'critical',
        category: 'environment',
        description: 'VITE_SUPABASE_ANON_KEY is missing',
        solution: 'Add VITE_SUPABASE_ANON_KEY to your .env file'
      });
    } else if (!anonKey.startsWith('eyJ')) {
      issues.push({
        severity: 'warning',
        category: 'environment',
        description: 'VITE_SUPABASE_ANON_KEY may be invalid',
        solution: 'Verify the key is correct in your Supabase dashboard'
      });
    }

    // Check Service Role Key (for admin functions)
    const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      issues.push({
        severity: 'warning',
        category: 'environment',
        description: 'SUPABASE_SERVICE_ROLE_KEY is missing - admin functions may not work',
        solution: 'Add SUPABASE_SERVICE_ROLE_KEY for admin operations'
      });
    }

    return issues;
  }

  private static async checkDatabaseSchema(): Promise<SchemaInfo> {
    const schemaInfo: SchemaInfo = {
      tablesAccessible: {},
      roleSystemType: 'unknown',
      enumsFound: [],
      triggersFound: []
    };

    // Check core tables
    const tables = ['profiles', 'user_roles', 'credits', 'campaigns', 'blog_posts'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        schemaInfo.tablesAccessible[table] = !error;
        
        if (error) {
          console.warn(`Table ${table} not accessible:`, error.message);
        }
      } catch (error: any) {
        schemaInfo.tablesAccessible[table] = false;
        console.warn(`Table ${table} check failed:`, error.message);
      }
    }

    // Determine role system type
    if (schemaInfo.tablesAccessible.profiles && schemaInfo.tablesAccessible.user_roles) {
      schemaInfo.roleSystemType = 'mixed';
    } else if (schemaInfo.tablesAccessible.profiles) {
      schemaInfo.roleSystemType = 'profiles_role';
    } else if (schemaInfo.tablesAccessible.user_roles) {
      schemaInfo.roleSystemType = 'user_roles_table';
    }

    return schemaInfo;
  }

  private static analyzeSchemaIssues(schemaInfo: SchemaInfo): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];

    // Check for missing core tables
    if (!schemaInfo.tablesAccessible.profiles) {
      issues.push({
        severity: 'critical',
        category: 'database',
        description: 'Profiles table is not accessible',
        solution: 'Run the database migration to create the profiles table'
      });
    }

    // Check for role system inconsistency
    if (schemaInfo.roleSystemType === 'mixed') {
      issues.push({
        severity: 'warning',
        category: 'database',
        description: 'Both profiles.role and user_roles table exist - this may cause conflicts',
        solution: 'Choose one role system and migrate data accordingly'
      });
    }

    if (schemaInfo.roleSystemType === 'unknown') {
      issues.push({
        severity: 'critical',
        category: 'database',
        description: 'No role system found - users cannot be assigned roles',
        solution: 'Set up either profiles.role column or user_roles table'
      });
    }

    return issues;
  }

  private static async checkRoleSystemConsistency(schemaInfo: SchemaInfo): Promise<ConfigurationIssue[]> {
    const issues: ConfigurationIssue[] = [];

    try {
      // Test role checking for current user
      if (schemaInfo.tablesAccessible.profiles) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .limit(1);

        if (profileError) {
          issues.push({
            severity: 'warning',
            category: 'database',
            description: `Cannot read roles from profiles table: ${profileError.message}`,
            solution: 'Check RLS policies for profiles table'
          });
        }
      }

      if (schemaInfo.tablesAccessible.user_roles) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .limit(1);

        if (roleError) {
          issues.push({
            severity: 'warning',
            category: 'database',
            description: `Cannot read from user_roles table: ${roleError.message}`,
            solution: 'Check RLS policies for user_roles table'
          });
        }
      }

    } catch (error: any) {
      issues.push({
        severity: 'warning',
        category: 'database',
        description: `Role system check failed: ${error.message}`,
        solution: 'Verify database connection and permissions'
      });
    }

    return issues;
  }

  private static async checkRLSPolicies(): Promise<ConfigurationIssue[]> {
    const issues: ConfigurationIssue[] = [];

    try {
      // Test basic CRUD operations on profiles
      const { error: selectError } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);

      if (selectError && selectError.message.includes('row-level security')) {
        issues.push({
          severity: 'warning',
          category: 'rls',
          description: 'RLS policies may be blocking profile access',
          solution: 'Review and update RLS policies for profiles table'
        });
      }

    } catch (error: any) {
      issues.push({
        severity: 'info',
        category: 'rls',
        description: `RLS policy check skipped: ${error.message}`,
        solution: 'Manual RLS policy review recommended'
      });
    }

    return issues;
  }

  private static async checkFunctionsAndTriggers(): Promise<ConfigurationIssue[]> {
    const issues: ConfigurationIssue[] = [];

    try {
      // Test if handle_new_user function exists and works
      // This is tricky to test without actually creating a user
      // For now, we'll just note if we've seen signup failures
      const signupFailures = localStorage.getItem('recent_signup_failures');
      if (signupFailures) {
        issues.push({
          severity: 'warning',
          category: 'functions',
          description: 'Recent signup failures detected - handle_new_user trigger may be faulty',
          solution: 'Check handle_new_user function and consider using manual profile creation'
        });
      }

    } catch (error: any) {
      issues.push({
        severity: 'info',
        category: 'functions',
        description: `Function check failed: ${error.message}`,
        solution: 'Manual function review recommended'
      });
    }

    return issues;
  }

  private static generateRecommendations(issues: ConfigurationIssue[], schemaInfo: SchemaInfo): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    if (criticalIssues.length > 0) {
      recommendations.push('🚨 Fix critical issues first before proceeding');
      criticalIssues.forEach(issue => {
        if (issue.solution) {
          recommendations.push(`• ${issue.solution}`);
        }
      });
    }

    if (schemaInfo.roleSystemType === 'mixed') {
      recommendations.push('🔧 Standardize on one role system: either profiles.role OR user_roles table');
      recommendations.push('• Recommended: Use profiles.role for simplicity');
    }

    if (!schemaInfo.tablesAccessible.profiles) {
      recommendations.push('📊 Run the latest database migration to create missing tables');
    }

    if (warningIssues.some(i => i.category === 'functions')) {
      recommendations.push('🛠️ Consider using manual profile creation to bypass trigger issues');
    }

    recommendations.push('✅ Test user registration after fixing identified issues');

    return recommendations;
  }
}

// Helper function to run a quick audit
export async function quickConfigurationCheck(): Promise<{ hasIssues: boolean; summary: string }> {
  try {
    const audit = await ConfigurationAudit.performAudit();
    const criticalCount = audit.issues.filter(i => i.severity === 'critical').length;
    const warningCount = audit.issues.filter(i => i.severity === 'warning').length;

    return {
      hasIssues: criticalCount > 0 || warningCount > 0,
      summary: `Found ${criticalCount} critical and ${warningCount} warning issues. Role system: ${audit.schemaInfo.roleSystemType}`
    };
  } catch (error: any) {
    return {
      hasIssues: true,
      summary: `Audit failed: ${error.message}`
    };
  }
}
