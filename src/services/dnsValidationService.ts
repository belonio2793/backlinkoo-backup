// Placeholder DNS validation service - DNS features removed
export class DNSValidationService {
  static async validateDomain(domain: string): Promise<{ valid: boolean; message: string }> {
    return { valid: false, message: 'DNS validation features have been removed' };
  }

  static async checkDNSRecords(domain: string): Promise<any[]> {
    return [];
  }
}

export default DNSValidationService;
