/**
 * Unicode Symbol Cleaner
 * Detects and removes problematic Unicode symbols that appear as encoding issues
 */

import React from 'react';

// Preserve intentional infinity symbol as it's part of the brand
const PRESERVED_SYMBOLS = ['∞'];

// Common problematic symbols that should be removed or replaced
const SYMBOL_REPLACEMENTS: Record<string, string> = {
  // Diamond and geometric symbols that often appear as encoding errors
  '◊': '',
  '◆': '',
  '◇': '',
  '♦': '',
  '♢': '',
  '◈': '',
  
  // Bullet points that may appear incorrectly
  '●': '•',
  '○': '°',
  '◉': '•',
  '◎': '•',
  '⦿': '•',
  '⦾': '•',
  '⊙': '•',
  '⊚': '•',
  '⊛': '•',
  '⊜': '•',
  '⊝': '•',
  
  // Box drawing and geometric symbols
  '■': '',
  '□': '',
  '▪': '',
  '▫': '',
  '▬': '-',
  '▭': '-',
  '▮': '|',
  '▯': '',
  
  // Triangular symbols
  '▲': '^',
  '▼': 'v',
  '◄': '<',
  '►': '>',
  '△': '^',
  '▽': 'v',
  '▴': '^',
  '▾': 'v',
  '◂': '<',
  '▸': '>',
  '▵': '^',
  '▿': 'v',
  '▷': '>',
  '◁': '<',
  
  // Weird control characters and spacing
  '\u200B': '', // Zero-width space
  '\u200C': '', // Zero-width non-joiner
  '\u200D': '', // Zero-width joiner
  '\u2060': '', // Word joiner
  '\uFEFF': '', // Zero-width no-break space (BOM)
  '\u00A0': ' ', // Non-breaking space to regular space
  
  // Various other problematic symbols
  '⬢': '',
  '⬡': '',
  '⬟': '',
  '⬠': '',
  '⬞': '',
  '⬝': '',
  '⬜': '',
  '⬛': '',
  
  // Replacement character (appears when encoding fails)
  '�': '',
  
  // Other geometric symbols that appear in encoding issues
  '⭘': '',
  '⭗': '',
  '⭕': '',
  '⭔': '',
  '⭓': '',
  '⭒': '',
  '⭑': '',
  '⭐': '*',
  
  // Mathematical symbols that often appear incorrectly
  '∘': '°',
  '∙': '•',
  '∗': '*',
  '∝': '~',
  '∞': '∞', // Keep this one as it's intentional
  
  // Miscellaneous symbols
  '⚬': '°',
  '⚫': '•',
  '⚪': '°',
  '※': '*',
  '‣': '>',
  '⁃': '-',
};

// Problematic Unicode ranges that often cause display issues
const PROBLEMATIC_RANGES = [
  [0x2580, 0x259F], // Block Elements
  [0x25A0, 0x25FF], // Geometric Shapes (partial)
  [0x2600, 0x26FF], // Miscellaneous Symbols (partial - preserve emojis)
  [0x2700, 0x27BF], // Dingbats (partial)
  [0x2980, 0x29FF], // Miscellaneous Mathematical Symbols-B
  [0x2A00, 0x2AFF], // Supplemental Mathematical Operators
  [0x2B00, 0x2BFF], // Miscellaneous Symbols and Arrows
];

/**
 * Checks if a character is in a problematic Unicode range
 */
function isProblematicSymbol(char: string): boolean {
  const code = char.charCodeAt(0);
  
  return PROBLEMATIC_RANGES.some(([start, end]) => 
    code >= start && code <= end
  );
}

/**
 * Cleans text by removing or replacing problematic Unicode symbols
 */
export function cleanSymbols(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let cleaned = text;

  // Apply symbol replacements
  for (const [symbol, replacement] of Object.entries(SYMBOL_REPLACEMENTS)) {
    // Skip if it's a preserved symbol
    if (PRESERVED_SYMBOLS.includes(symbol)) {
      continue;
    }
    
    cleaned = cleaned.replace(new RegExp(symbol, 'g'), replacement);
  }

  // Remove characters in problematic ranges (except preserved ones)
  cleaned = cleaned.replace(/./g, (char) => {
    if (PRESERVED_SYMBOLS.includes(char)) {
      return char;
    }
    
    if (isProblematicSymbol(char)) {
      return '';
    }
    
    return char;
  });

  // Clean up multiple spaces and normalize whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Detects if text contains problematic symbols
 */
export function hasProblematicSymbols(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check for known problematic symbols
  for (const symbol of Object.keys(SYMBOL_REPLACEMENTS)) {
    if (PRESERVED_SYMBOLS.includes(symbol)) {
      continue;
    }
    
    if (text.includes(symbol)) {
      return true;
    }
  }

  // Check for characters in problematic ranges
  for (const char of text) {
    if (PRESERVED_SYMBOLS.includes(char)) {
      continue;
    }
    
    if (isProblematicSymbol(char)) {
      return true;
    }
  }

  return false;
}

/**
 * Auto-clean text content in DOM elements
 */
export function autoCleanDOMText(element: Element = document.body): void {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textNodes: Text[] = [];
  let node: Node | null;

  // Collect all text nodes
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  // Clean each text node
  textNodes.forEach((textNode) => {
    const originalText = textNode.textContent || '';
    const cleanedText = cleanSymbols(originalText);
    
    if (originalText !== cleanedText) {
      console.log('🧹 Symbol cleaner: Cleaned text node', {
        original: originalText,
        cleaned: cleanedText
      });
      textNode.textContent = cleanedText;
    }
  });
}

/**
 * Cleans all input values and textarea content
 */
export function cleanFormInputs(): void {
  const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
  
  inputs.forEach((input) => {
    const element = input as HTMLInputElement | HTMLTextAreaElement;
    const originalValue = element.value;
    const cleanedValue = cleanSymbols(originalValue);
    
    if (originalValue !== cleanedValue) {
      console.log('🧹 Symbol cleaner: Cleaned form input', {
        original: originalValue,
        cleaned: cleanedValue
      });
      element.value = cleanedValue;
    }
  });
}

/**
 * Global symbol detection and cleaning system
 */
export class GlobalSymbolCleaner {
  private observer: MutationObserver | null = null;
  private isEnabled = false;

  /**
   * Start automatic symbol detection and cleaning
   */
  start(): void {
    if (this.isEnabled) {
      return;
    }

    this.isEnabled = true;
    console.log('🧹 Global Symbol Cleaner: Started');

    // Initial cleanup
    this.runFullCleanup();

    // Set up mutation observer for dynamic content
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              autoCleanDOMText(node as Element);
            } else if (node.nodeType === Node.TEXT_NODE) {
              const textNode = node as Text;
              const originalText = textNode.textContent || '';
              const cleanedText = cleanSymbols(originalText);
              
              if (originalText !== cleanedText) {
                console.log('🧹 Symbol cleaner: Cleaned new text node', {
                  original: originalText,
                  cleaned: cleanedText
                });
                textNode.textContent = cleanedText;
              }
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Clean form inputs periodically
    setInterval(() => {
      cleanFormInputs();
    }, 5000);
  }

  /**
   * Stop automatic symbol cleaning
   */
  stop(): void {
    if (!this.isEnabled) {
      return;
    }

    this.isEnabled = false;
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    console.log('🧹 Global Symbol Cleaner: Stopped');
  }

  /**
   * Run a complete cleanup of the page
   */
  runFullCleanup(): void {
    console.log('🧹 Symbol cleaner: Running full page cleanup');
    
    // Clean all text content
    autoCleanDOMText(document.body);
    
    // Clean form inputs
    cleanFormInputs();
    
    // Clean console messages (for development)
    if (process.env.NODE_ENV === 'development') {
      this.cleanConsoleOutput();
    }
  }

  /**
   * Clean console output (development only)
   */
  private cleanConsoleOutput(): void {
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.log = (...args: any[]) => {
      const cleanedArgs = args.map(arg => 
        typeof arg === 'string' ? cleanSymbols(arg) : arg
      );
      originalConsoleLog.apply(console, cleanedArgs);
    };

    console.warn = (...args: any[]) => {
      const cleanedArgs = args.map(arg => 
        typeof arg === 'string' ? cleanSymbols(arg) : arg
      );
      originalConsoleWarn.apply(console, cleanedArgs);
    };

    console.error = (...args: any[]) => {
      const cleanedArgs = args.map(arg => 
        typeof arg === 'string' ? cleanSymbols(arg) : arg
      );
      originalConsoleError.apply(console, cleanedArgs);
    };
  }
}

// Global instance
export const globalSymbolCleaner = new GlobalSymbolCleaner();

// React Hook for automatic cleaning
export function useSymbolCleaner(enabled: boolean = true) {
  React.useEffect(() => {
    if (enabled) {
      globalSymbolCleaner.start();
      return () => globalSymbolCleaner.stop();
    }
  }, [enabled]);
}

// Export for global use
if (typeof window !== 'undefined') {
  (window as any).symbolCleaner = {
    clean: cleanSymbols,
    detect: hasProblematicSymbols,
    autoClean: autoCleanDOMText,
    global: globalSymbolCleaner
  };
}
