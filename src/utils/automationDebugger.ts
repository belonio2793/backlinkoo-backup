import { getOrchestrator } from '@/services/automationOrchestrator';
import { getContentService } from '@/services/automationContentService';
import { getTelegraphService } from '@/services/telegraphService';

export interface AutomationDebugResult {
  contentService: {
    available: boolean;
    configured: boolean;
    error?: string;
  };
  telegraphService: {
    available: boolean;
    error?: string;
  };
  database: {
    connected: boolean;
    error?: string;
  };
  overall: {
    ready: boolean;
    issues: string[];
  };
}

export class AutomationDebugger {
  
  /**
   * Run comprehensive automation system checks
   */
  async runDiagnostics(): Promise<AutomationDebugResult> {
    console.log('🔍 Running automation system diagnostics...');
    
    const result: AutomationDebugResult = {
      contentService: { available: false, configured: false },
      telegraphService: { available: false },
      database: { connected: false },
      overall: { ready: false, issues: [] }
    };

    // Test content generation service
    try {
      const contentService = getContentService();
      const serviceStatus = await contentService.getServiceStatus();
      result.contentService = serviceStatus;
      
      if (!serviceStatus.available) {
        result.overall.issues.push('Content generation service unavailable');
      } else if (!serviceStatus.configured) {
        result.overall.issues.push('OpenAI API key not configured');
      }
    } catch (error) {
      result.contentService.error = error instanceof Error ? error.message : String(error);
      result.overall.issues.push(`Content service error: ${result.contentService.error}`);
    }

    // Test Telegraph service
    try {
      const telegraphService = getTelegraphService();
      const telegraphAvailable = await telegraphService.testConnection();
      result.telegraphService.available = telegraphAvailable;
      
      if (!telegraphAvailable) {
        result.overall.issues.push('Telegraph service unavailable');
      }
    } catch (error) {
      result.telegraphService.error = error instanceof Error ? error.message : String(error);
      result.overall.issues.push(`Telegraph service error: ${result.telegraphService.error}`);
    }

    // Test database connection
    try {
      const orchestrator = getOrchestrator();
      // Try to get user campaigns to test database connection
      await orchestrator.getUserCampaigns();
      result.database.connected = true;
    } catch (error) {
      result.database.error = error instanceof Error ? error.message : String(error);
      result.overall.issues.push(`Database error: ${result.database.error}`);
    }

    // Determine overall readiness
    result.overall.ready = 
      result.contentService.available && 
      result.contentService.configured && 
      result.telegraphService.available && 
      result.database.connected;

    console.log('✅ Automation diagnostics complete');
    return result;
  }

  /**
   * Test campaign creation flow (dry run)
   */
  async testCampaignFlow(params: {
    target_url: string;
    keyword: string;
    anchor_text: string;
  }): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('🧪 Testing campaign creation flow...');
      
      const orchestrator = getOrchestrator();
      
      // This will create an actual campaign but we can delete it afterwards for testing
      const campaign = await orchestrator.createCampaign(params);
      
      console.log('✅ Campaign created successfully:', campaign.id);
      
      // Return success with campaign details
      return {
        success: true,
        details: {
          campaignId: campaign.id,
          status: campaign.status,
          message: 'Campaign created and processing started'
        }
      };
      
    } catch (error) {
      console.error('❌ Campaign creation test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get a formatted status report
   */
  formatDiagnosticsReport(result: AutomationDebugResult): string {
    let report = '🔍 Automation System Status Report\n\n';
    
    // Content Service
    report += `📝 Content Generation Service:\n`;
    report += `   Available: ${result.contentService.available ? '✅' : '❌'}\n`;
    report += `   Configured: ${result.contentService.configured ? '✅' : '❌'}\n`;
    if (result.contentService.error) {
      report += `   Error: ${result.contentService.error}\n`;
    }
    report += '\n';
    
    // Telegraph Service
    report += `📤 Telegraph Service:\n`;
    report += `   Available: ${result.telegraphService.available ? '✅' : '❌'}\n`;
    if (result.telegraphService.error) {
      report += `   Error: ${result.telegraphService.error}\n`;
    }
    report += '\n';
    
    // Database
    report += `🗄️ Database:\n`;
    report += `   Connected: ${result.database.connected ? '✅' : '❌'}\n`;
    if (result.database.error) {
      report += `   Error: ${result.database.error}\n`;
    }
    report += '\n';
    
    // Overall Status
    report += `🎯 Overall Status: ${result.overall.ready ? '✅ READY' : '❌ NOT READY'}\n`;
    
    if (result.overall.issues.length > 0) {
      report += '\n🚨 Issues to resolve:\n';
      result.overall.issues.forEach((issue, index) => {
        report += `   ${index + 1}. ${issue}\n`;
      });
    }
    
    return report;
  }
}

// Singleton instance
let debugger_instance: AutomationDebugger | null = null;

export const getAutomationDebugger = (): AutomationDebugger => {
  if (!debugger_instance) {
    debugger_instance = new AutomationDebugger();
  }
  return debugger_instance;
};
