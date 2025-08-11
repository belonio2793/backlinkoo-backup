/**
 * Text Cleaner Utility
 * Automatically detects and removes replacement characters and other problematic characters
 */

// Common problematic characters that should be cleaned
const PROBLEMATIC_CHARS = {
  REPLACEMENT_CHAR: '\uFFFD', // � - Unicode replacement character
  NULL_CHAR: '\u0000',        // Null character
  BYTE_ORDER_MARK: '\uFEFF',  // BOM (Byte Order Mark)
  ZERO_WIDTH_SPACE: '\u200B', // Zero-width space
  ZERO_WIDTH_NON_JOINER: '\u200C',
  ZERO_WIDTH_JOINER: '\u200D',
  NON_BREAKING_SPACE: '\u00A0', // Sometimes problematic
} as const;

/**
 * Clean a single string of problematic characters
 */
export function cleanText(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let cleaned = text;
  
  // Remove all problematic characters
  Object.values(PROBLEMATIC_CHARS).forEach(char => {
    cleaned = cleaned.replace(new RegExp(char, 'g'), '');
  });

  // Additional cleanup for common encoding issues
  cleaned = cleaned
    // Remove multiple consecutive spaces
    .replace(/\s{2,}/g, ' ')
    // Remove leading/trailing whitespace
    .trim();

  return cleaned;
}

/**
 * Clean all text content in a DOM element recursively
 */
export function cleanDOMElement(element: Element): void {
  // Clean text nodes
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textNodes: Text[] = [];
  let node;
  
  while (node = walker.nextNode()) {
    textNodes.push(node as Text);
  }

  textNodes.forEach(textNode => {
    const originalText = textNode.textContent || '';
    const cleanedText = cleanText(originalText);
    
    if (originalText !== cleanedText) {
      textNode.textContent = cleanedText;
      console.log('Text cleaned:', { original: originalText, cleaned: cleanedText });
    }
  });

  // Clean attributes that might contain text
  const attributesToClean = ['title', 'alt', 'placeholder', 'value', 'aria-label'];
  
  const allElements = element.querySelectorAll('*');
  allElements.forEach(el => {
    attributesToClean.forEach(attr => {
      const value = el.getAttribute(attr);
      if (value) {
        const cleanedValue = cleanText(value);
        if (value !== cleanedValue) {
          el.setAttribute(attr, cleanedValue);
          console.log(`Attribute ${attr} cleaned:`, { original: value, cleaned: cleanedValue });
        }
      }
    });
  });
}

/**
 * Clean the entire document
 */
export function cleanDocument(): void {
  cleanDOMElement(document.body);
}

/**
 * Object cleaner - recursively clean all string properties
 */
export function cleanObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (typeof obj === 'string') {
    return cleanText(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item)) as T;
  }

  const cleaned = {} as T;
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        cleaned[key] = cleanText(value) as T[Extract<keyof T, string>];
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = cleanObject(value);
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
}

/**
 * Auto-cleaner that runs periodically
 */
export class AutoCleaner {
  private intervalId: number | null = null;
  private isRunning = false;
  private observer: MutationObserver | null = null;

  /**
   * Start automatic cleaning
   * @param intervalMs - How often to run the cleaner (default: 1 second for instant removal)
   */
  start(intervalMs: number = 1000): void {
    if (this.isRunning) {
      console.warn('AutoCleaner is already running');
      return;
    }

    this.isRunning = true;
    console.log('AutoCleaner started');

    // Run immediately
    this.runCleanup();

    // Then run periodically
    this.intervalId = window.setInterval(() => {
      this.runCleanup();
    }, intervalMs);

    // Set up DOM observer for instant cleaning
    this.setupDOMObserver();
  }

  /**
   * Stop automatic cleaning
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isRunning = false;
    console.log('AutoCleaner stopped');
  }

  /**
   * Run a single cleanup cycle
   */
  private runCleanup(): void {
    try {
      // Clean the document
      cleanDocument();
      
      // Clean form inputs specifically
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          const originalValue = input.value;
          const cleanedValue = cleanText(originalValue);
          
          if (originalValue !== cleanedValue) {
            input.value = cleanedValue;
            console.log('🧹 Input value cleaned - removed � and other problematic chars:', { original: originalValue, cleaned: cleanedValue });
          }
        }
      });

    } catch (error) {
      console.error('Error during AutoCleaner cleanup:', error);
    }
  }

  /**
   * Setup DOM observer for instant cleaning of new content
   */
  private setupDOMObserver(): void {
    if (typeof window === 'undefined' || !window.MutationObserver) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      let needsCleaning = false;

      mutations.forEach((mutation) => {
        // Check for text changes
        if (mutation.type === 'characterData') {
          const textContent = mutation.target.textContent || '';
          if (hasProblematicrChars(textContent)) {
            needsCleaning = true;
          }
        }

        // Check for new nodes
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const textContent = node.textContent || '';
              if (hasProblematicrChars(textContent)) {
                needsCleaning = true;
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const textContent = (node as Element).textContent || '';
              if (hasProblematicrChars(textContent)) {
                needsCleaning = true;
              }
            }
          });
        }
      });

      if (needsCleaning) {
        console.log('🧹 AutoCleaner: Detected � or other problematic characters, cleaning immediately...');
        this.runCleanup();
      }
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: false
    });
  }

  /**
   * Check if the cleaner is currently running
   */
  get running(): boolean {
    return this.isRunning;
  }
}

/**
 * Global auto-cleaner instance
 */
export const globalAutoCleaner = new AutoCleaner();

/**
 * Detect if text contains problematic characters
 */
export function hasProblematicrChars(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  return Object.values(PROBLEMATIC_CHARS).some(char => text.includes(char));
}

/**
 * Get statistics about cleaned characters
 */
export function getCleaningStats(text: string): {
  original: string;
  cleaned: string;
  removedChars: string[];
  charCount: number;
} {
  const cleaned = cleanText(text);
  const removedChars: string[] = [];
  
  Object.values(PROBLEMATIC_CHARS).forEach(char => {
    const matches = (text.match(new RegExp(char, 'g')) || []);
    if (matches.length > 0) {
      removedChars.push(...matches);
    }
  });

  return {
    original: text,
    cleaned,
    removedChars,
    charCount: removedChars.length
  };
}
