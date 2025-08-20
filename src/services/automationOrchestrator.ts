// Placeholder automation orchestrator - automation features removed
export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  target_url: string;
  keywords: string[];
  anchor_texts: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_message?: string;
}

export class AutomationOrchestrator {
  async createCampaign(): Promise<Campaign> {
    throw new Error('Automation features have been removed');
  }

  async getUserCampaigns(): Promise<Campaign[]> {
    return [];
  }

  async getCampaign(): Promise<Campaign | null> {
    return null;
  }

  async pauseCampaign(): Promise<void> {
    throw new Error('Automation features have been removed');
  }

  async resumeCampaign(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Automation features have been removed' };
  }
}

export function getOrchestrator(): AutomationOrchestrator {
  return new AutomationOrchestrator();
}
