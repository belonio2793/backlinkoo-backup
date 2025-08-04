/**
 * Masks an email address to protect privacy while still showing some identifying information
 * Example: john.doe@example.com -> j***@ex***e.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [localPart, domain] = email.split('@');
  
  // Mask local part (before @)
  let maskedLocal = '';
  if (localPart.length <= 1) {
    maskedLocal = '*';
  } else if (localPart.length <= 3) {
    maskedLocal = localPart[0] + '*'.repeat(localPart.length - 1);
  } else {
    maskedLocal = localPart[0] + '*'.repeat(Math.min(3, localPart.length - 2)) + localPart[localPart.length - 1];
  }

  // Mask domain part (after @)
  let maskedDomain = '';
  if (domain.includes('.')) {
    const domainParts = domain.split('.');
    const mainDomain = domainParts[0];
    const extension = domainParts.slice(1).join('.');
    
    if (mainDomain.length <= 2) {
      maskedDomain = '*'.repeat(mainDomain.length);
    } else {
      maskedDomain = mainDomain.substring(0, 2) + '*'.repeat(Math.max(0, mainDomain.length - 3)) + mainDomain[mainDomain.length - 1];
    }
    
    maskedDomain += '.' + extension;
  } else {
    // No dot in domain (shouldn't happen with valid emails)
    maskedDomain = domain.length <= 2 ? '*'.repeat(domain.length) : domain[0] + '*'.repeat(domain.length - 2) + domain[domain.length - 1];
  }

  return `${maskedLocal}@${maskedDomain}`;
}
