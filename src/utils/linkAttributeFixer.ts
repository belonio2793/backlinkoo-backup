/**
 * Link Attribute Fixer Utility
 * Fixes malformed link attributes in blog content
 */

export class LinkAttributeFixer {
  /**
   * Fix all malformed link patterns in content
   */
  static fixMalformedLinks(content: string): string {
    console.log('🔧 LinkAttributeFixer: Processing content for malformed links...');
    
    // Pattern 1: Fix the specific Go High Level Stars pattern
    content = content.replace(
      /<a\s+hrefhttps\s*=""\s*:\s*=""\s*gohighlevelstars\.com\s*=""\s*stylecolor:[^>]*>/gi,
      '<a href="https://gohighlevelstars.com" target="_blank" rel="noopener" style="color:#2563eb;font-weight:500;text-decoration:underline;">'
    );
    
    // Pattern 2: More general malformed href patterns
    content = content.replace(
      /<a\s+hrefhttps\s*=""\s*:\s*=""\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*=""\s*[^>]*>/gi,
      '<a href="https://$1" target="_blank" rel="noopener" style="color:#2563eb;font-weight:500;text-decoration:underline;">'
    );
    
    // Pattern 3: Fix malformed style attributes
    content = content.replace(
      /<a([^>]*)\s+stylecolor:\s*#([0-9a-fA-F]{6});font-weight:\s*\d+;\s*"=""/gi,
      '<a$1 style="color:#$2;font-weight:500;text-decoration:underline;"'
    );
    
    // Pattern 4: Fix split attributes like href="" :="" domain=""
    content = content.replace(
      /<a\s+href\s*=""\s*:\s*=""\s*([^"\s]+)\s*=""/gi,
      '<a href="https://$1"'
    );
    
    // Pattern 5: Fix target and rel attributes that got mangled
    content = content.replace(
      /target\s*_?\s*blank\s*=""/gi,
      'target="_blank"'
    );
    
    content = content.replace(
      /rel\s*no\s*opener\s*=""/gi,
      'rel="noopener"'
    );
    
    // Pattern 6: Comprehensive attribute cleanup
    content = content.replace(
      /<a\s+([^>]*?)>/gi,
      (match, attrs) => {
        // Check for severely malformed patterns
        if (attrs.includes('hrefhttps') || attrs.includes('stylecolor')) {
          // Extract domain if possible
          const domainMatch = attrs.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (domainMatch) {
            const domain = domainMatch[1];
            console.log('🔗 Fixed malformed link for:', domain);
            return `<a href="https://${domain}" target="_blank" rel="noopener" style="color:#2563eb;font-weight:500;text-decoration:underline;">`;
          }
        }
        
        // Fix normal attributes
        let fixedAttrs = attrs
          .replace(/href\s*=\s*"([^"]*)"/, 'href="$1"')
          .replace(/target\s*=\s*"([^"]*)"/, 'target="$1"')
          .replace(/rel\s*=\s*"([^"]*)"/, 'rel="$1"')
          .replace(/style\s*=\s*"([^"]*)"/, 'style="$1"');
        
        // Ensure proper values
        if (!fixedAttrs.includes('target=')) {
          fixedAttrs += ' target="_blank"';
        }
        if (!fixedAttrs.includes('rel=')) {
          fixedAttrs += ' rel="noopener"';
        }
        if (!fixedAttrs.includes('style=')) {
          fixedAttrs += ' style="color:#2563eb;font-weight:500;text-decoration:underline;"';
        }
        
        return `<a ${fixedAttrs.trim()}>`;
      }
    );
    
    console.log('✅ LinkAttributeFixer: Completed processing');
    return content;
  }
  
  /**
   * Add proper link styling to all links
   */
  static ensureLinkStyling(content: string): string {
    return content.replace(
      /<a([^>]*?)>/gi,
      (match, attrs) => {
        // If it already has proper styling, keep it
        if (attrs.includes('style=') && attrs.includes('color:') && attrs.includes('text-decoration:')) {
          return match;
        }
        
        // Add or update styling
        let newAttrs = attrs;
        
        if (!newAttrs.includes('style=')) {
          newAttrs += ' style="color:#2563eb;font-weight:500;text-decoration:underline;"';
        } else {
          // Update existing style
          newAttrs = newAttrs.replace(
            /style="([^"]*?)"/,
            (styleMatch, styleContent) => {
              let style = styleContent;
              if (!style.includes('color:')) {
                style += ';color:#2563eb';
              }
              if (!style.includes('font-weight:')) {
                style += ';font-weight:500';
              }
              if (!style.includes('text-decoration:')) {
                style += ';text-decoration:underline';
              }
              return `style="${style}"`;
            }
          );
        }
        
        // Ensure target and rel attributes
        if (!newAttrs.includes('target=')) {
          newAttrs += ' target="_blank"';
        }
        if (!newAttrs.includes('rel=')) {
          newAttrs += ' rel="noopener"';
        }
        
        return `<a${newAttrs}>`;
      }
    );
  }
  
  /**
   * Convert plain URLs to clickable links
   */
  static convertPlainUrls(content: string): string {
    return content.replace(
      /(^|[^<"'])(https?:\/\/[^\s<>"']+)/gi,
      '$1<a href="$2" target="_blank" rel="noopener" style="color:#2563eb;font-weight:500;text-decoration:underline;">$2</a>'
    );
  }
}
