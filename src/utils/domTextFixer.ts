/**
 * DOM Text Fixer
 * Real-time observer to fix malformed HTML and text patterns as they appear in the DOM
 */

class DOMTextFixer {
  private static instance: DOMTextFixer;
  private observer: MutationObserver | null = null;
  private isProcessing = false;

  static getInstance(): DOMTextFixer {
    if (!this.instance) {
      this.instance = new DOMTextFixer();
    }
    return this.instance;
  }

  init(): void {
    if (typeof window === 'undefined' || this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      if (this.isProcessing) return; // Prevent infinite loops
      
      let shouldFix = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              shouldFix = true;
            }
          });
        } else if (mutation.type === 'characterData') {
          shouldFix = true;
        }
      });
      
      if (shouldFix) {
        requestAnimationFrame(() => this.fixDOMIssues());
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Initial fix
    this.fixDOMIssues();

    console.log('🔧 DOM text fixer initialized');
  }

  private fixDOMIssues(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Fix malformed HTML tags
      this.fixMalformedTags();
      
      // Fix text content issues
      this.fixTextContent();
      
      // Fix style attributes
      this.fixStyleAttributes();
      
    } catch (error) {
      console.warn('Error in DOM text fixer:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private fixMalformedTags(): void {
    // Fix malformed heading tags
    const malformedHeadings = document.querySelectorAll('h[1=""], h[2=""], h[3=""], h[4=""], h[5=""], h[6=""]');
    malformedHeadings.forEach((element) => {
      const tagName = element.tagName.toLowerCase();
      if (tagName.includes(' ')) {
        // Extract the level number
        const match = tagName.match(/h\s*([1-6])/);
        if (match) {
          const level = match[1];
          const newElement = document.createElement(`h${level}`);
          newElement.innerHTML = element.innerHTML;
          
          // Copy attributes except the malformed ones
          Array.from(element.attributes).forEach((attr) => {
            if (attr.name !== '1' && attr.name !== '2' && attr.name !== '3' && 
                attr.name !== '4' && attr.name !== '5' && attr.name !== '6' && 
                attr.value !== '') {
              newElement.setAttribute(attr.name, attr.value);
            }
          });
          
          element.parentNode?.replaceChild(newElement, element);
        }
      }
    });
  }

  private fixTextContent(): void {
    // Create a TreeWalker to find all text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style tags
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodesToFix: Text[] = [];
    let node: Text | null;
    
    while (node = walker.nextNode() as Text) {
      if (node.textContent && this.needsTextFix(node.textContent)) {
        textNodesToFix.push(node);
      }
    }

    textNodesToFix.forEach((textNode) => {
      if (textNode.textContent) {
        const fixedText = this.fixTextPatterns(textNode.textContent);
        if (fixedText !== textNode.textContent) {
          textNode.textContent = fixedText;
        }
      }
    });
  }

  private needsTextFix(text: string): boolean {
    return text.includes('beautomatically') ||
           text.includes('deletedin') ||
           /[a-z][A-Z]/.test(text) ||
           text.includes('0views') ||
           /\d+min(?!\s)/.test(text);
  }

  private fixTextPatterns(text: string): string {
    return text
      // Fix the main issue
      .replace(/beautomatically\s*deletedin/gi, ' be automatically deleted in')
      .replace(/beauto\s*matically\s*deletedin/gi, ' be automatically deleted in')
      .replace(/beautomatically/gi, ' be automatically ')
      .replace(/deletedin(\d+)/gi, ' deleted in $1')
      .replace(/deletedin/gi, ' deleted in ')
      
      // Fix common concatenation issues
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/0views/g, '0 views')
      .replace(/(\d+)min(?!\s)/g, '$1 min')
      .replace(/(\d+)h(?=\d)/g, '$1h ')
      .replace(/(\d+)m(?=\s+remaining)/g, '$1m')
      
      // Clean up extra spaces
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private fixStyleAttributes(): void {
    // Find elements with corrupted style attributes
    const elementsWithBadStyles = document.querySelectorAll('[style*="&lt;"], [style*="&gt;"], [style*="&amp;"]');
    
    elementsWithBadStyles.forEach((element) => {
      const styleAttr = element.getAttribute('style');
      if (styleAttr && (styleAttr.includes('&lt;') || styleAttr.includes('&gt;') || styleAttr.includes('&amp;'))) {
        // Replace with a clean style
        element.setAttribute('style', 'color:#2563eb;font-weight:500;');
      }
    });

    // Fix specific corrupted color patterns
    const elementsWithCorruptedColor = document.querySelectorAll('[style*="color: # 2"], [style*="563 eb"]');
    elementsWithCorruptedColor.forEach((element) => {
      element.setAttribute('style', 'color:#2563eb;font-weight:500;');
    });
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      DOMTextFixer.getInstance().init();
    });
  } else {
    DOMTextFixer.getInstance().init();
  }
}

export { DOMTextFixer };
