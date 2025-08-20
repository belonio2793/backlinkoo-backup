// Placeholder automation mock service - automation features removed
export interface MockCampaignConfig {
  keyword: string;
  targetUrl: string;
  anchorText: string;
}

export interface MockCampaignResult {
  success: boolean;
  message: string;
}

export class AutomationMockService {
  async runMockCampaign(): Promise<MockCampaignResult> {
    return { success: false, message: 'Automation features have been removed' };
  }
}

export function getAutomationMockService(): AutomationMockService {
  return new AutomationMockService();
}
