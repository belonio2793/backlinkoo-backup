import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { checkSavedReportsTableAccess, initializeSavedReportsTable } from '@/utils/initializeDatabase';

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

  // Fallback storage keys
  private static readonly STORAGE_KEY = 'saved_backlink_reports';
  private static readonly STORAGE_VERSION = '1.0';

  /**
   * Save report to localStorage as fallback
   */
  private static saveToLocalStorage(report: any): void {
    try {
      const existingReports = this.getFromLocalStorage();
      const newReport = {
        ...report,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      existingReports.push(newReport);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        version: this.STORAGE_VERSION,
        reports: existingReports
      }));

      console.log('📱 Report saved to localStorage as fallback');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Get reports from localStorage
   */
  private static getFromLocalStorage(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.reports || [];
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return [];
    }
  }

  /**
   * Remove report from localStorage
   */
  private static removeFromLocalStorage(reportId: string): void {
    try {
      const existingReports = this.getFromLocalStorage();
      const filteredReports = existingReports.filter(report => report.id !== reportId);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        version: this.STORAGE_VERSION,
        reports: filteredReports
      }));
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }
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

    // Check table access first
    let hasAccess = await checkSavedReportsTableAccess();

    if (!hasAccess) {
      console.log('🔧 Table not accessible, attempting to initialize...');

      // Try to call the initialization function
      try {
        const response = await fetch('/api/initialize-saved-reports-table', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          console.log('✅ Table initialization API called successfully');
          // Wait a moment for the table to be created
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Check access again
          hasAccess = await checkSavedReportsTableAccess();
        } else {
          console.warn('⚠️ Table initialization API failed:', await response.text());
        }
      } catch (error) {
        console.warn('⚠️ Could not call table initialization API:', error);
      }

      // If still no access, use localStorage fallback
      if (!hasAccess) {
        console.log('📱 Using localStorage fallback for saving report');
        await initializeSavedReportsTable(); // This will log the SQL commands needed

        // Create fallback report object
        const fallbackReport = {
          user_id: user.id,
          title: title.trim(),
          keyword: keyword.trim(),
          anchor_text: anchorText.trim(),
          destination_url: destinationUrl.trim(),
          report_data: reportData,
          report_summary: summary,
          total_urls: summary.totalUrls,
          verified_backlinks: verifiedCount
        };

        this.saveToLocalStorage(fallbackReport);

        // Return a mock database response
        return {
          ...fallbackReport,
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as SavedBacklinkReport;
      }
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
      if (error.code === '42P01') {
        throw new Error('Saved reports feature is not available yet. Please contact support.');
      }
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
    let databaseReports: SavedBacklinkReport[] = [];

    if (hasAccess) {
      const { data, error } = await supabase
        .from('saved_backlink_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved reports:', error);

        // If table doesn't exist, continue to localStorage fallback
        if (error.code !== '42P01') {
          throw new Error(`Failed to fetch reports: ${error.message}`);
        }
      } else {
        databaseReports = data || [];
      }
    }

    // Get localStorage reports as fallback
    const localReports = this.getFromLocalStorage()
      .filter(report => report.user_id === user.id)
      .map(report => ({
        ...report,
        // Ensure all required fields are present
        id: report.id || `local_${Date.now()}`,
        user_id: report.user_id || user.id,
        title: report.title || 'Untitled Report',
        keyword: report.keyword || '',
        anchor_text: report.anchor_text || '',
        destination_url: report.destination_url || '',
        report_data: report.report_data || {},
        report_summary: report.report_summary || null,
        total_urls: report.total_urls || 0,
        verified_backlinks: report.verified_backlinks || 0,
        created_at: report.created_at || new Date().toISOString(),
        updated_at: report.updated_at || new Date().toISOString()
      })) as SavedBacklinkReport[];

    // Combine database and local reports, removing duplicates
    const allReports = [...databaseReports, ...localReports];

    if (!hasAccess && localReports.length > 0) {
      console.log(`📱 Loaded ${localReports.length} reports from localStorage (database not available)`);
    }

    return allReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

    // Check if it's a local report
    if (reportId.startsWith('local_')) {
      this.removeFromLocalStorage(reportId);
      console.log('📱 Report removed from localStorage');
      return;
    }

    // Try to delete from database
    const hasAccess = await checkSavedReportsTableAccess();
    if (hasAccess) {
      const { error } = await supabase
        .from('saved_backlink_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting saved report:', error);
        throw new Error(`Failed to delete report: ${error.message}`);
      }
    } else {
      // Also try to remove from localStorage in case it was saved there
      this.removeFromLocalStorage(reportId);
      console.log('📱 Database not available, removed from localStorage if it existed');
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
