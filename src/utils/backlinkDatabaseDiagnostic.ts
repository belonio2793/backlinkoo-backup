import { supabase } from '@/integrations/supabase/client';

export interface TableDiagnostic {
  exists: boolean;
  columns: string[];
  errors: string[];
  isCorrectSchema: boolean;
}

export interface DatabaseDiagnostic {
  backlink_campaigns: TableDiagnostic;
  automation_campaigns: TableDiagnostic;
  hasConflicts: boolean;
  recommendations: string[];
}

export async function diagnoseDatabaseTables(): Promise<DatabaseDiagnostic> {
  const diagnostic: DatabaseDiagnostic = {
    backlink_campaigns: { exists: false, columns: [], errors: [], isCorrectSchema: false },
    automation_campaigns: { exists: false, columns: [], errors: [], isCorrectSchema: false },
    hasConflicts: false,
    recommendations: []
  };

  // Check backlink_campaigns table
  try {
    const { error: backlinkError } = await supabase
      .from('backlink_campaigns')
      .select('id, name, target_url, keyword, anchor_text, target_platform, status, links_found, links_posted')
      .limit(1);

    if (!backlinkError) {
      diagnostic.backlink_campaigns.exists = true;
      diagnostic.backlink_campaigns.isCorrectSchema = true;
      diagnostic.backlink_campaigns.columns = [
        'id', 'name', 'target_url', 'keyword', 'anchor_text', 
        'target_platform', 'status', 'links_found', 'links_posted'
      ];
    } else {
      diagnostic.backlink_campaigns.errors.push(backlinkError.message);
      if (backlinkError.message.includes('does not exist')) {
        diagnostic.recommendations.push('Create backlink_campaigns table using the SQL setup script');
      } else if (backlinkError.message.includes('column')) {
        diagnostic.backlink_campaigns.exists = true;
        diagnostic.recommendations.push('Update backlink_campaigns table schema - some columns are missing');
      }
    }
  } catch (error: any) {
    diagnostic.backlink_campaigns.errors.push(`Query error: ${error.message}`);
  }

  // Check automation_campaigns table (conflicting table)
  try {
    const { error: automationError } = await supabase
      .from('automation_campaigns')
      .select('id, auto_start')
      .limit(1);

    if (!automationError) {
      diagnostic.automation_campaigns.exists = true;
      diagnostic.automation_campaigns.columns = ['id', 'auto_start'];
      
      // Check if there's a conflict
      if (diagnostic.backlink_campaigns.exists) {
        diagnostic.hasConflicts = true;
        diagnostic.recommendations.push(
          'WARNING: Both automation_campaigns and backlink_campaigns tables exist. ' +
          'This may cause conflicts. Ensure your code is using the correct table.'
        );
      }
    }
  } catch (error: any) {
    diagnostic.automation_campaigns.errors.push(`Query error: ${error.message}`);
  }

  // Final recommendations
  if (!diagnostic.backlink_campaigns.exists) {
    diagnostic.recommendations.push('REQUIRED: Run the backlink automation database setup script');
  }

  if (diagnostic.hasConflicts) {
    diagnostic.recommendations.push(
      'CONFLICT DETECTED: Multiple campaign tables exist. ' +
      'Verify that your application is using backlink_campaigns, not automation_campaigns.'
    );
  }

  return diagnostic;
}

export function formatDiagnosticReport(diagnostic: DatabaseDiagnostic): string {
  let report = '=== BACKLINK AUTOMATION DATABASE DIAGNOSTIC ===\n\n';

  report += '📊 TABLE STATUS:\n';
  report += `  backlink_campaigns: ${diagnostic.backlink_campaigns.exists ? '✅ EXISTS' : '❌ MISSING'}\n`;
  report += `  automation_campaigns: ${diagnostic.automation_campaigns.exists ? '⚠️ EXISTS (conflicting)' : '✅ NOT FOUND'}\n\n`;

  if (diagnostic.backlink_campaigns.exists) {
    report += '✅ BACKLINK_CAMPAIGNS TABLE:\n';
    report += `  Schema Status: ${diagnostic.backlink_campaigns.isCorrectSchema ? 'CORRECT' : 'INCOMPLETE'}\n`;
    report += `  Columns: ${diagnostic.backlink_campaigns.columns.join(', ')}\n\n`;
  }

  if (diagnostic.automation_campaigns.exists) {
    report += '⚠️ AUTOMATION_CAMPAIGNS TABLE (POTENTIAL CONFLICT):\n';
    report += `  Columns: ${diagnostic.automation_campaigns.columns.join(', ')}\n`;
    report += '  Note: This table has boolean columns that may conflict with string data\n\n';
  }

  if (diagnostic.hasConflicts) {
    report += '🚨 CONFLICTS DETECTED:\n';
    report += '  Multiple campaign tables exist which may cause data type conflicts\n\n';
  }

  if (diagnostic.recommendations.length > 0) {
    report += '💡 RECOMMENDATIONS:\n';
    diagnostic.recommendations.forEach((rec, index) => {
      report += `  ${index + 1}. ${rec}\n`;
    });
  }

  return report;
}
