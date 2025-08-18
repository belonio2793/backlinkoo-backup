/**
 * Mock Write.as Publisher for Development Environment
 * Simulates Write.as publishing without making actual API calls
 */

import { realTimeFeedService } from './realTimeFeedService';
import { campaignNetworkLogger } from './campaignNetworkLogger';

export interface MockWriteAsPublishRequest {
  title: string;
  content: string;
  authorName?: string;
}

export interface MockWriteAsPublishResult {
  success: boolean;
  url?: string;
  error?: string;
  mockData?: {
    postId: string;
    publishedAt: string;
    wordCount: number;
  };
}

class MockWriteAsPublisher {
  
  /**
   * Mock publish content to Write.as
   */
  async publishContent(request: MockWriteAsPublishRequest): Promise<MockWriteAsPublishResult> {
    const { title, content, authorName = 'Anonymous' } = request;
    
    try {
      console.log('🎭 [MOCK] Publishing to Write.as...');
      
      // Simulate API delay
      await this.simulateDelay(800, 1500);
      
      // Generate mock post ID and URL
      const postId = this.generateMockPostId();
      const mockUrl = `https://write.as/${postId}`;
      
      // Calculate word count
      const wordCount = content.split(/\s+/).length;
      
      // Log network request for debugging
      const currentCampaignId = campaignNetworkLogger.getCurrentCampaignId();
      if (currentCampaignId) {
        campaignNetworkLogger.logNetworkRequest(currentCampaignId, {
          url: 'https://write.as/api/posts',
          method: 'POST',
          type: 'api',
          step: 'publishing',
          timestamp: new Date(),
          duration: 1200,
          body: { title, body: content },
          response: {
            status: 200,
            data: { id: postId, url: mockUrl }
          }
        });
      }
      
      // Emit real-time event
      realTimeFeedService.emitSystemEvent(`Mock published to Write.as: ${title}`, 'success');
      
      console.log(`✅ [MOCK] Published to Write.as: ${mockUrl}`);
      
      return {
        success: true,
        url: mockUrl,
        mockData: {
          postId,
          publishedAt: new Date().toISOString(),
          wordCount
        }
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [MOCK] Write.as publishing failed:', errorMessage);
      
      return {
        success: false,
        error: `Mock Write.as publishing failed: ${errorMessage}`
      };
    }
  }
  
  /**
   * Simulate network delay for realistic behavior
   */
  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Generate a realistic-looking Write.as post ID
   */
  private generateMockPostId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  /**
   * Validate Write.as URL format
   */
  static isValidWriteAsUrl(url: string): boolean {
    return /^https:\/\/write\.as\/[a-z0-9]+$/.test(url);
  }
}

// Export singleton instance
export default new MockWriteAsPublisher();
