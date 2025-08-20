// Placeholder Netlify DNS sync - DNS features removed
export class NetlifyDNSSync {
  static async syncDomain(domain: string): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Netlify DNS sync features have been removed' };
  }

  static async getSyncStatus(domain: string): Promise<string> {
    return 'disabled';
  }
}

export default NetlifyDNSSync;
