// Fallback service for when automation tables don't exist yet
export class FallbackAutomationService {
  static async createCampaign(campaignData: any) {
    console.warn('⚠️ Using fallback automation service - database tables not available');
    
    // Create a mock campaign ID
    const mockCampaign = {
      id: `mock-${Date.now()}`,
      ...campaignData,
      created_at: new Date().toISOString(),
      status: campaignData.status || 'draft',
      total_links_built: 0,
      success_rate: 0
    };
    
    // Store in local storage temporarily
    const existing = JSON.parse(localStorage.getItem('mock-campaigns') || '[]');
    existing.push(mockCampaign);
    localStorage.setItem('mock-campaigns', JSON.stringify(existing));
    
    return { success: true, data: mockCampaign };
  }
  
  static async getCampaigns(userId: string) {
    console.warn('⚠️ Using fallback automation service - database tables not available');
    
    // Get from local storage
    const campaigns = JSON.parse(localStorage.getItem('mock-campaigns') || '[]');
    
    return { success: true, data: campaigns };
  }
  
  static async updateCampaign(campaignId: string, updates: any) {
    console.warn('⚠️ Using fallback automation service - database tables not available');
    
    const campaigns = JSON.parse(localStorage.getItem('mock-campaigns') || '[]');
    const index = campaigns.findIndex((c: any) => c.id === campaignId);
    
    if (index !== -1) {
      campaigns[index] = { ...campaigns[index], ...updates };
      localStorage.setItem('mock-campaigns', JSON.stringify(campaigns));
      return { success: true, data: campaigns[index] };
    }
    
    return { success: false, error: 'Campaign not found' };
  }
  
  static async deleteCampaign(campaignId: string) {
    console.warn('⚠️ Using fallback automation service - database tables not available');
    
    const campaigns = JSON.parse(localStorage.getItem('mock-campaigns') || '[]');
    const filtered = campaigns.filter((c: any) => c.id !== campaignId);
    localStorage.setItem('mock-campaigns', JSON.stringify(filtered));
    
    return { success: true };
  }
  
  static async getLinkPlacements(userId: string) {
    console.warn('⚠️ Using fallback automation service - database tables not available');
    return { success: true, data: [] };
  }
  
  static async getUserQuota(userId: string) {
    console.warn('⚠️ Using fallback automation service - database tables not available');
    
    const defaultQuota = {
      id: `mock-quota-${userId}`,
      user_id: userId,
      plan_type: 'free',
      total_quota: 20,
      used_quota: 0,
      remaining_quota: 20,
      reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_updated: new Date().toISOString()
    };
    
    return { success: true, data: defaultQuota };
  }
  
  static async getAvailableSites() {
    console.warn('⚠️ Using fallback automation service - database tables not available');
    return { success: true, data: [] };
  }
}
