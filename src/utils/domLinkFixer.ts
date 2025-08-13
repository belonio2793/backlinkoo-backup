/**
 * DOM Link Fixer - Runtime link fixing for malformed links
 */

export class DOMLinkFixer {
  /**
   * Fix all malformed links in the current document
   */
  static fixAllMalformedLinks(): number {
    console.log('🔧 DOMLinkFixer: Scanning for malformed links...');
    
    // Find links with malformed attributes
    const malformedSelectors = [
      'a[hrefhttps]',
      'a[stylecolor]', 
      'a[target_blank]',
      'a[relnoopener]'
    ];
    
    let fixedCount = 0;
    
    malformedSelectors.forEach(selector => {
      const links = document.querySelectorAll(selector);
      console.log(`Found ${links.length} links matching ${selector}`);
      
      links.forEach(link => {
        const htmlLink = link as HTMLAnchorElement;
        this.fixSingleLink(htmlLink);
        fixedCount++;
      });
    });
    
    // Also check for links without proper href but with domain in other attributes
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(link => {
      const htmlLink = link as HTMLAnchorElement;
      if (!htmlLink.href || htmlLink.href === window.location.href) {
        // Check if any attribute contains a domain
        const attrs = Array.from(htmlLink.attributes);
        for (const attr of attrs) {
          if (attr.name.includes('.com') || attr.name.includes('.net') || attr.name.includes('.org')) {
            this.fixSingleLink(htmlLink);
            fixedCount++;
            break;
          }
        }
      }
    });
    
    console.log(`✅ DOMLinkFixer: Fixed ${fixedCount} malformed links`);
    return fixedCount;
  }
  
  /**
   * Fix a single malformed link element
   */
  static fixSingleLink(link: HTMLAnchorElement): void {
    const linkText = link.textContent || '';
    const attrs = Array.from(link.attributes);
    let domain = '';
    
    console.log('🔧 Fixing link:', linkText, 'with attributes:', attrs.map(a => `${a.name}="${a.value}"`));
    
    // Extract domain from various malformed patterns
    for (const attr of attrs) {
      if (attr.name.includes('.com') || attr.name.includes('.net') || attr.name.includes('.org')) {
        domain = attr.name;
        break;
      }
    }
    
    // Special cases
    if (linkText.includes('Go High Level Stars') || domain.includes('gohighlevelstars')) {
      domain = 'gohighlevelstars.com';
    }
    
    if (domain) {
      console.log(`✅ Fixing link to: https://${domain}`);
      
      // Remove all existing attributes
      attrs.forEach(attr => {
        link.removeAttribute(attr.name);
      });
      
      // Set proper attributes
      link.href = `https://${domain}`;
      link.target = '_blank';
      link.rel = 'noopener';
      link.style.cssText = 'color:#2563eb;font-weight:500;text-decoration:underline;';
      
      // Add a class to mark as fixed
      link.classList.add('link-fixed');
    }
  }
  
  /**
   * Start a mutation observer to fix links as they're added to the DOM
   */
  static startLinkWatcher(): MutationObserver {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check if the added node is a malformed link
              if (element.tagName === 'A' && 
                  (element.hasAttribute('hrefhttps') || element.hasAttribute('stylecolor'))) {
                this.fixSingleLink(element as HTMLAnchorElement);
              }
              
              // Check for malformed links within the added element
              const malformedLinks = element.querySelectorAll('a[hrefhttps], a[stylecolor]');
              malformedLinks.forEach(link => {
                this.fixSingleLink(link as HTMLAnchorElement);
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('🔍 DOMLinkFixer: Started mutation observer for dynamic link fixing');
    return observer;
  }
  
  /**
   * Run a comprehensive link scan and fix
   */
  static runComprehensiveFix(): void {
    console.log('🚀 DOMLinkFixer: Running comprehensive link fix...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.fixAllMalformedLinks();
        this.startLinkWatcher();
      });
    } else {
      this.fixAllMalformedLinks();
      this.startLinkWatcher();
    }
    
    // Also run after a short delay in case content is dynamically loaded
    setTimeout(() => {
      this.fixAllMalformedLinks();
    }, 1000);
  }
}

// Auto-run on page load
if (typeof window !== 'undefined') {
  DOMLinkFixer.runComprehensiveFix();
}
