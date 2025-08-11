/**
 * Campaign Creation Helper
 * Ensures campaigns are properly saved with unique identifiers and validated data
 */
import { supabase } from '@/integrations/supabase/client';
import type { AutomationCampaignInsert } from '@/types/automationTypes';

export interface CampaignCreationData {
  name: string;
  engine_type: string;
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: 'draft' | 'active' | 'paused';
  daily_limit: number;
  auto_start: boolean;
}

export class CampaignCreationHelper {
  
  /**
   * Generate a unique campaign name identifier
   */
  static generateUniqueIdentifier(baseName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 40);
    
    return `${cleanBaseName}-${timestamp}-${randomSuffix}`;
  }

  /**
   * Validate and normalize campaign data
   */
  static validateCampaignData(data: CampaignCreationData): {
    isValid: boolean;
    errors: string[];
    normalizedData?: CampaignCreationData;
  } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!data.name?.trim()) {
      errors.push('Campaign name is required');
    }
    
    if (!data.target_url?.trim()) {
      errors.push('Target URL is required');
    }
    
    if (!data.keywords?.length) {
      errors.push('At least one keyword is required');
    }
    
    if (!data.anchor_texts?.length) {
      errors.push('At least one anchor text is required');
    }
    
    // Validate URL format
    let normalizedUrl = data.target_url?.trim();
    if (normalizedUrl && !normalizedUrl.match(/^https?:\/\//)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    try {
      if (normalizedUrl) {
        new URL(normalizedUrl);
      }
    } catch {
      errors.push('Invalid URL format');
    }
    
    // Validate keywords and anchor texts
    const validKeywords = data.keywords?.filter(k => k?.trim()).map(k => k.trim()) || [];
    const validAnchorTexts = data.anchor_texts?.filter(a => a?.trim()).map(a => a.trim()) || [];
    
    if (validKeywords.length === 0) {
      errors.push('At least one valid keyword is required');
    }
    
    if (validAnchorTexts.length === 0) {
      errors.push('At least one valid anchor text is required');
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
    
    // Return normalized data
    const normalizedData: CampaignCreationData = {
      ...data,
      name: data.name.trim(),
      target_url: normalizedUrl,
      keywords: validKeywords,
      anchor_texts: validAnchorTexts,
      engine_type: data.engine_type.replace('-', '_'), // Normalize engine type
      daily_limit: Math.max(1, Math.min(100, data.daily_limit)) // Clamp between 1-100
    };
    
    return { isValid: true, errors: [], normalizedData };
  }

  /**
   * Check for duplicate campaigns
   */
  static async checkForDuplicates(userId: string, targetUrl: string): Promise<{
    hasDuplicate: boolean;
    existingCampaign?: any;
  }> {
    try {
      const { data: existingCampaigns, error } = await supabase
        .from('automation_campaigns')
        .select('id, name, target_url, status')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error checking for duplicates:', error.message);
        return { hasDuplicate: false };
      }

      // Normalize both URLs for comparison
      const normalizeUrl = (url: string) => {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      };

      const normalizedTargetUrl = normalizeUrl(targetUrl);
      
      const duplicate = existingCampaigns?.find(campaign => {
        const existingUrl = normalizeUrl(campaign.target_url || '');
        return existingUrl === normalizedTargetUrl;
      });

      return {
        hasDuplicate: !!duplicate,
        existingCampaign: duplicate
      };
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return { hasDuplicate: false };
    }
  }

  /**
   * Create campaign with enhanced validation and unique identifier
   */
  static async createCampaignWithUniqueId(
    userId: string, 
    campaignData: CampaignCreationData
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    campaignId?: string;
  }> {
    try {
      // Step 1: Validate data
      const validation = this.validateCampaignData(campaignData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const normalizedData = validation.normalizedData!;

      // Step 2: Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(userId, normalizedData.target_url);
      if (duplicateCheck.hasDuplicate) {
        return {
          success: false,
          error: `Campaign already exists for "${normalizedData.target_url}": "${duplicateCheck.existingCampaign?.name}"`
        };
      }

      // Step 3: Generate unique identifier
      const uniqueName = this.generateUniqueIdentifier(normalizedData.name);

      // Step 4: Prepare campaign data for database
      const dbCampaignData: AutomationCampaignInsert = {
        user_id: userId,
        name: uniqueName,
        engine_type: normalizedData.engine_type,
        target_url: normalizedData.target_url,
        keywords: normalizedData.keywords,
        anchor_texts: normalizedData.anchor_texts,
        status: normalizedData.status,
        daily_limit: normalizedData.daily_limit,
        auto_start: normalizedData.auto_start,
        started_at: normalizedData.auto_start ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Step 5: Insert into database
      const { data, error } = await supabase
        .from('automation_campaigns')
        .insert(dbCampaignData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating campaign:', error);
        return {
          success: false,
          error: `Failed to create campaign: ${error.message}`
        };
      }

      console.log('✅ Campaign created successfully:', {
        id: data.id,
        name: data.name,
        target_url: data.target_url,
        keywords: data.keywords,
        anchor_texts: data.anchor_texts,
        auto_start: data.auto_start
      });

      return {
        success: true,
        data,
        campaignId: data.id
      };

    } catch (error: any) {
      console.error('Unexpected error creating campaign:', error);
      return {
        success: false,
        error: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Verify campaign was saved correctly
   */
  static async verifyCampaignSaved(campaignId: string): Promise<{
    isValid: boolean;
    details?: any;
    errors?: string[];
  }> {
    try {
      const { data: campaign, error } = await supabase
        .from('automation_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) {
        return {
          isValid: false,
          errors: [`Failed to verify campaign: ${error.message}`]
        };
      }

      const errors: string[] = [];

      // Check required fields
      if (!campaign.name) errors.push('Campaign name is missing');
      if (!campaign.target_url) errors.push('Target URL is missing');
      if (!campaign.keywords?.length) errors.push('Keywords are missing');
      if (!campaign.anchor_texts?.length) errors.push('Anchor texts are missing');
      if (!campaign.engine_type) errors.push('Engine type is missing');

      // Check data integrity
      const urlValid = campaign.target_url?.startsWith('http');
      if (!urlValid) errors.push('URL format is invalid');

      return {
        isValid: errors.length === 0,
        details: campaign,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error: any) {
      return {
        isValid: false,
        errors: [`Verification failed: ${error.message}`]
      };
    }
  }
}
