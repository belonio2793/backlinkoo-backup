// Placeholder Netlify domain service - domain features removed
export class NetlifyDomainService {
  static async createDomain(domain: string): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Netlify domain features have been removed' };
  }

  static async deleteDomain(domain: string): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Netlify domain features have been removed' };
  }

  static async listDomains(): Promise<any[]> {
    return [];
  }
}

export default NetlifyDomainService;
