// Placeholder Netlify DNS manager - DNS features removed
export class NetlifyDNSManager {
  static async addDomain(domain: string): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Netlify DNS features have been removed' };
  }

  static async removeDomain(domain: string): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Netlify DNS features have been removed' };
  }

  static async getDomains(): Promise<any[]> {
    return [];
  }
}

export default NetlifyDNSManager;
