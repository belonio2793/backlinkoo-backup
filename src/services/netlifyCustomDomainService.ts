// Placeholder Netlify custom domain service - domain features removed
export class NetlifyCustomDomainService {
  static async addCustomDomain(domain: string): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Netlify custom domain features have been removed' };
  }

  static async removeCustomDomain(domain: string): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Netlify custom domain features have been removed' };
  }

  static async getCustomDomains(): Promise<any[]> {
    return [];
  }

  static isConfiguredSync(): boolean {
    return false;
  }
}

export default NetlifyCustomDomainService;
