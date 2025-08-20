// Placeholder automation content service - automation features removed
export interface ContentGenerationParams {
  keyword: string;
  anchorText: string;
  targetUrl: string;
}

export class AutomationContentService {
  async generateAllContent(): Promise<any[]> {
    throw new Error('Automation features have been removed');
  }
}

export function getContentService(): AutomationContentService {
  return new AutomationContentService();
}
