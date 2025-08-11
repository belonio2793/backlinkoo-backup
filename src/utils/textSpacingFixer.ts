/**
 * Text Spacing Fixer - Utility to fix text concatenation issues
 * This runs after DOM rendering to ensure proper spacing
 */

export class TextSpacingFixer {
  /**
   * Fix text spacing issues throughout the document
   */
  static fixTextSpacing(): void {
    // Fix common patterns where text runs together
    this.fixNumberTextPatterns();
    this.fixTimeDisplays();
    this.fixViewCounts();
    this.fixModalText();
    this.fixGeneralSpacing();
  }

  /**
   * Fix number + text patterns (e.g., "5views" -> "5 views")
   */
  private static fixNumberTextPatterns(): void {
    const textNodes = this.getAllTextNodes();
    
    textNodes.forEach(node => {
      if (!node.textContent) return;
      
      let text = node.textContent;
      
      // Fix patterns like "123views", "0views", etc.
      text = text.replace(/(\d+)(views?)/gi, '$1 $2');
      
      // Fix patterns like "5h51m", "2h30m", etc.
      text = text.replace(/(\d+h)(\d+m)/gi, '$1 $2');
      
      // Fix patterns like "automaticallydeleted", "beautomatically", etc.
      text = text.replace(/(automatically|beautomatically)(deleted?|deletedin)/gi, 'automatically deleted in');
      
      // Fix general word concatenations
      text = text.replace(/([a-z])([A-Z])/g, '$1 $2'); // camelCase to spaced
      
      if (text !== node.textContent) {
        node.textContent = text;
      }
    });
  }

  /**
   * Fix time display patterns
   */
  private static fixTimeDisplays(): void {
    const timeElements = document.querySelectorAll('[class*="time"], [class*="remaining"], .font-mono');
    
    timeElements.forEach(element => {
      if (!element.textContent) return;
      
      let text = element.textContent;
      
      // Fix time patterns
      text = text.replace(/(\d+h)(\d+m)/gi, '$1 $2');
      text = text.replace(/(\d+)h(\d+)m/gi, '$1h $2m');
      text = text.replace(/remaining([A-Za-z])/gi, 'remaining $1');
      text = text.replace(/([a-z])remaining/gi, '$1 remaining');
      
      if (text !== element.textContent) {
        element.textContent = text;
      }
    });
  }

  /**
   * Fix view count displays
   */
  private static fixViewCounts(): void {
    const viewElements = document.querySelectorAll('[class*="view"], [class*="meta"]');
    
    viewElements.forEach(element => {
      if (!element.textContent) return;
      
      let text = element.textContent;
      
      // Fix view patterns
      text = text.replace(/(\d+)(views?)/gi, '$1 $2');
      text = text.replace(/(\d+)views/gi, '$1 views');
      
      if (text !== element.textContent) {
        element.textContent = text;
      }
    });
  }

  /**
   * Fix text in modals and popups
   */
  private static fixModalText(): void {
    const modalElements = document.querySelectorAll('[role="dialog"], .modal, .popup, .fixed');
    
    modalElements.forEach(modal => {
      const textNodes = this.getAllTextNodesInElement(modal as Element);
      
      textNodes.forEach(node => {
        if (!node.textContent) return;
        
        let text = node.textContent;
        
        // Fix common modal text concatenation issues
        text = text.replace(/(automatically)(deleted?)/gi, '$1 $2');
        text = text.replace(/(deleted?)(in)/gi, '$1 $2');
        text = text.replace(/(\d+h)(\d+m)/gi, '$1 $2');
        text = text.replace(/(remaining)(if)/gi, '$1 $2');
        
        if (text !== node.textContent) {
          node.textContent = text;
        }
      });
    });
  }

  /**
   * Fix general spacing issues
   */
  private static fixGeneralSpacing(): void {
    // Add spaces around elements that might be missing them
    const elementsWithPotentialIssues = document.querySelectorAll('.font-semibold, .font-medium, .font-bold');
    
    elementsWithPotentialIssues.forEach(element => {
      const parent = element.parentNode;
      if (!parent) return;
      
      // Ensure there's space before this element if it's not the first child
      const previousSibling = element.previousSibling;
      if (previousSibling && previousSibling.nodeType === Node.TEXT_NODE) {
        const text = previousSibling.textContent || '';
        if (!text.endsWith(' ') && !text.endsWith('\n')) {
          previousSibling.textContent = text + ' ';
        }
      }
      
      // Ensure there's space after this element if it's not the last child
      const nextSibling = element.nextSibling;
      if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
        const text = nextSibling.textContent || '';
        if (!text.startsWith(' ') && !text.startsWith('\n')) {
          nextSibling.textContent = ' ' + text;
        }
      }
    });
  }

  /**
   * Get all text nodes in the document
   */
  private static getAllTextNodes(): Text[] {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes: Text[] = [];
    let node: Text | null;

    while (node = walker.nextNode() as Text) {
      // Skip script and style elements
      const parent = node.parentElement;
      if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
        continue;
      }
      textNodes.push(node);
    }

    return textNodes;
  }

  /**
   * Get all text nodes within a specific element
   */
  private static getAllTextNodesInElement(element: Element): Text[] {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes: Text[] = [];
    let node: Text | null;

    while (node = walker.nextNode() as Text) {
      textNodes.push(node);
    }

    return textNodes;
  }

  /**
   * Initialize the text spacing fixer with automatic detection
   */
  static initialize(): void {
    // Run immediately
    this.fixTextSpacing();
    
    // Run after a short delay to catch dynamically rendered content
    setTimeout(() => this.fixTextSpacing(), 100);
    setTimeout(() => this.fixTextSpacing(), 500);
    
    // Set up a mutation observer to fix text spacing when content changes
    const observer = new MutationObserver(() => {
      setTimeout(() => this.fixTextSpacing(), 50);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TextSpacingFixer.initialize());
  } else {
    TextSpacingFixer.initialize();
  }
}
