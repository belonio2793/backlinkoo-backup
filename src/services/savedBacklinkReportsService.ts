import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { checkSavedReportsTableAccess } from '@/utils/initializeDatabase';

export type SavedBacklinkReport = Tables<'saved_backlink_reports'>;
export type SavedBacklinkReportInsert = TablesInsert<'saved_backlink_reports'>;
export type SavedBacklinkReportUpdate = TablesUpdate<'saved_backlink_reports'>;

export interface BacklinkReportData {
  id: string;
  campaignName: string;
  verificationParams: {
    keyword: string;
    anchorText: string;
    destinationUrl: string;
  };
  backlinks: any[];
  createdAt: string;
  totalBacklinks: number;
  results: any[];
}

export class SavedBacklinkReportsService {
  /**
   * Save a backlink report for the authenticated user
   */
  static async saveReport(
    title: string,
    keyword: string,
    anchorText: string,
    destinationUrl: string,
    reportData: BacklinkReportData
  ): Promise<SavedBacklinkReport> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to save reports');
    }

    // Calculate summary statistics
    const verifiedCount = reportData.results?.filter(r => r.verification?.isVerified).length || 0;
    const summary = {
      totalUrls: reportData.totalBacklinks || reportData.backlinks?.length || 0,
      verifiedBacklinks: verifiedCount,
      verificationRate: reportData.totalBacklinks > 0 ? (verifiedCount / reportData.totalBacklinks) * 100 : 0,
      createdAt: reportData.createdAt || new Date().toISOString()
    };

    const insertData: SavedBacklinkReportInsert = {
      user_id: user.id,
      title: title.trim(),
      keyword: keyword.trim(),
      anchor_text: anchorText.trim(),
      destination_url: destinationUrl.trim(),
      report_data: reportData as any,
      report_summary: summary,
      total_urls: summary.totalUrls,
      verified_backlinks: verifiedCount
    };

    const { data, error } = await supabase
      .from('saved_backlink_reports')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error saving backlink report:', error);
      throw new Error(`Failed to save report: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all saved reports for the authenticated user
   */
  static async getUserReports(): Promise<SavedBacklinkReport[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to fetch reports');
    }

    // Check table access and provide helpful error message
    const hasAccess = await checkSavedReportsTableAccess();
    if (!hasAccess) {
      console.warn('⚠️ saved_backlink_reports table not accessible - feature may not be available yet');
      return []; // Return empty array instead of throwing error
    }

    const { data, error } = await supabase
      .from('saved_backlink_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved reports:', error);

      // If table doesn't exist, return empty array instead of error
      if (error.code === '42P01') {
        console.warn('⚠️ saved_backlink_reports table does not exist yet');
        return [];
      }

      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific saved report by ID
   */
  static async getReport(reportId: string): Promise<SavedBacklinkReport | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to fetch reports');
    }

    const { data, error } = await supabase
      .from('saved_backlink_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Report not found
      }
      console.error('Error fetching saved report:', error);
      throw new Error(`Failed to fetch report: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a saved report
   */
  static async updateReport(
    reportId: string, 
    updates: Partial<SavedBacklinkReportUpdate>
  ): Promise<SavedBacklinkReport> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update reports');
    }

    const { data, error } = await supabase
      .from('saved_backlink_reports')
      .update(updates)
      .eq('id', reportId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating saved report:', error);
      throw new Error(`Failed to update report: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a saved report
   */
  static async deleteReport(reportId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete reports');
    }

    const { error } = await supabase
      .from('saved_backlink_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting saved report:', error);
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }

  /**
   * Generate a shareable report URL
   */
  static generateReportUrl(reportData: BacklinkReportData): string {
    const reportId = reportData.id || `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    return `${window.location.origin}/report/${reportId}`;
  }

  /**
   * Format report data for display
   */
  static formatReportSummary(report: SavedBacklinkReport): string {
    const summary = report.report_summary as any;
    if (!summary) return 'No summary available';
    
    const rate = summary.verificationRate || 0;
    return `${summary.verifiedBacklinks}/${summary.totalUrls} verified (${rate.toFixed(1)}%)`;
  }
}
