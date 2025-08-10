import TextFormatter from './textFormatter';

/**
 * DOM Text Formatter - Automatically formats text content in the DOM
 */
class DOMTextFormatter {
  private static readonly TEXT_SELECTORS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'span', 'div[class*="description"]', 
    'div[class*="title"]', 'label',
    '.card-title', '.card-description',
    '[data-format-text]'
  ];

  private static readonly EXCLUDE_SELECTORS = [
    'script', 'style', 'code', 'pre',
    '.no-format', '[data-no-format]',
    'input', 'textarea', 'select',
    '.monaco-editor', '.cm-editor'
  ];

  /**
   * Format all text content in a container
   */
  static formatContainer(container: HTMLElement = document.body): number {
    let formattedCount = 0;

    // Get all text nodes
    const textNodes = this.getTextNodes(container);
    
    textNodes.forEach(node => {
      try {
        if (this.shouldFormatNode(node)) {
          const originalText = node.textContent || '';
          if (originalText && typeof originalText === 'string') {
            const formattedText = this.determineFormattingType(node, originalText);

            if (formattedText && formattedText !== originalText) {
              node.textContent = formattedText;
              formattedCount++;
            }
          }
        }
      } catch (error) {
        console.warn('DOM text formatting error:', error);
      }
    });

    return formattedCount;
  }

  /**
   * Get all text nodes in a container
   */
  private static getTextNodes(container: HTMLElement): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          
          // Skip excluded elements
          if (this.EXCLUDE_SELECTORS.some(selector => 
            parent.matches(selector) || parent.closest(selector)
          )) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Only process text with actual content
          const text = node.textContent?.trim();
          if (!text || text.length < 3) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    return textNodes;
  }

  /**
   * Determine if a text node should be formatted
   */
  private static shouldFormatNode(node: Text): boolean {
    const parent = node.parentElement;
    if (!parent) return false;

    // Check if parent has data attributes for formatting control
    if (parent.hasAttribute('data-no-format')) return false;
    if (parent.closest('[data-no-format]')) return false;

    // Check if it's within an editable element
    if (parent.isContentEditable) return false;

    // Check if it's within form inputs
    if (parent.closest('input, textarea, select')) return false;

    return true;
  }

  /**
   * Determine the appropriate formatting type based on context
   */
  private static determineFormattingType(node: Text, text: string): string {
    const parent = node.parentElement;
    if (!parent) return text;

    // Check for explicit formatting type
    const formatType = parent.getAttribute('data-format-type');
    if (formatType) {
      return TextFormatter.formatUIText(text, formatType as any);
    }

    // Determine by element type and classes
    const tagName = parent.tagName.toLowerCase();
    const className = parent.className.toLowerCase();

    // Titles
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName) ||
        className.includes('title') ||
        className.includes('heading')) {
      return TextFormatter.formatTitle(text);
    }

    // Labels
    if (tagName === 'label' ||
        className.includes('label') ||
        className.includes('form-label')) {
      return TextFormatter.formatListItem(text);
    }

    // Buttons
    if (tagName === 'button' ||
        parent.closest('button') ||
        className.includes('btn') ||
        className.includes('button')) {
      return TextFormatter.formatListItem(text);
    }

    // Links
    if (tagName === 'a' ||
        parent.closest('a') ||
        className.includes('link')) {
      return TextFormatter.formatListItem(text);
    }

    // Descriptions
    if (className.includes('description') ||
        className.includes('subtitle') ||
        tagName === 'p') {
      return TextFormatter.formatDescription(text);
    }

    // Default to sentence formatting
    return TextFormatter.formatSentence(text);
  }

  /**
   * Format text in cards specifically
   */
  static formatCards(container: HTMLElement = document.body): number {
    let formattedCount = 0;
    const cards = container.querySelectorAll('.card, [class*="card"]');

    cards.forEach(card => {
      // Format card titles
      const titles = card.querySelectorAll('.card-title, [class*="title"]');
      titles.forEach(title => {
        const text = title.textContent?.trim();
        if (text) {
          const formatted = TextFormatter.formatTitle(text);
          if (formatted !== text) {
            title.textContent = formatted;
            formattedCount++;
          }
        }
      });

      // Format card descriptions
      const descriptions = card.querySelectorAll('.card-description, [class*="description"]');
      descriptions.forEach(desc => {
        const text = desc.textContent?.trim();
        if (text) {
          const formatted = TextFormatter.formatDescription(text);
          if (formatted !== text) {
            desc.textContent = formatted;
            formattedCount++;
          }
        }
      });
    });

    return formattedCount;
  }

  /**
   * Format form elements
   */
  static formatForms(container: HTMLElement = document.body): number {
    let formattedCount = 0;
    
    // Format labels
    const labels = container.querySelectorAll('label');
    labels.forEach(label => {
      const text = label.textContent?.trim();
      if (text) {
        const formatted = TextFormatter.formatListItem(text);
        if (formatted !== text) {
          label.textContent = formatted;
          formattedCount++;
        }
      }
    });

    // Format placeholder text
    const inputs = container.querySelectorAll('input[placeholder], textarea[placeholder]');
    inputs.forEach(input => {
      const element = input as HTMLInputElement | HTMLTextAreaElement;
      const placeholder = element.placeholder?.trim();
      if (placeholder) {
        const formatted = TextFormatter.formatListItem(placeholder);
        if (formatted !== placeholder) {
          element.placeholder = formatted;
          formattedCount++;
        }
      }
    });

    return formattedCount;
  }

  /**
   * Format all text content with comprehensive coverage
   */
  static formatAll(container: HTMLElement = document.body): {
    total: number;
    cards: number;
    forms: number;
    general: number;
  } {
    const cards = this.formatCards(container);
    const forms = this.formatForms(container);
    const general = this.formatContainer(container);

    return {
      total: cards + forms + general,
      cards,
      forms,
      general
    };
  }

  /**
   * Auto-format on DOM changes (for dynamic content)
   */
  static setupAutoFormatting(container: HTMLElement = document.body): MutationObserver {
    const observer = new MutationObserver(mutations => {
      let shouldFormat = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldFormat = true;
            }
          });
        }
      });

      if (shouldFormat) {
        // Debounce formatting
        setTimeout(() => {
          this.formatAll(container);
        }, 100);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    return observer;
  }
}

export default DOMTextFormatter;
