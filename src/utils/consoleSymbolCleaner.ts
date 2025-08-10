/**
 * Console utility for quick symbol cleaning
 * Usage: Run `cleanSymbolsNow()` in browser console
 */

import { globalSymbolCleaner, cleanSymbols, hasProblematicSymbols, autoCleanDOMText } from './symbolCleaner';

// Quick cleanup function for console use
const cleanSymbolsNow = () => {
  console.log('🧹 Starting immediate symbol cleanup...');
  
  // Run full cleanup
  globalSymbolCleaner.runFullCleanup();
  
  // Report results
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let totalNodes = 0;
  let cleanedNodes = 0;
  const problematicSymbols = new Set<string>();
  
  let node: Node | null;
  while ((node = walker.nextNode())) {
    totalNodes++;
    const text = node.textContent || '';
    
    if (hasProblematicSymbols(text)) {
      cleanedNodes++;
      // Find specific symbols
      for (const char of text) {
        if (hasProblematicSymbols(char)) {
          problematicSymbols.add(char);
        }
      }
    }
  }

  console.log('✅ Symbol cleanup complete!');
  console.log(`📊 Results:
    - Total text nodes: ${totalNodes}
    - Nodes with issues: ${cleanedNodes}
    - Problematic symbols found: ${Array.from(problematicSymbols).join(', ') || 'None'}
  `);

  if (problematicSymbols.size > 0) {
    console.log('🔍 Found these problematic symbols:', Array.from(problematicSymbols));
  }

  return {
    totalNodes,
    cleanedNodes,
    problematicSymbols: Array.from(problematicSymbols)
  };
};

// Test function for specific text
const testSymbolCleaning = (text: string) => {
  console.log('🧪 Testing symbol cleaning...');
  console.log('Original:', text);
  console.log('Has problems:', hasProblematicSymbols(text));
  console.log('Cleaned:', cleanSymbols(text));
  
  return {
    original: text,
    hasProblems: hasProblematicSymbols(text),
    cleaned: cleanSymbols(text)
  };
};

// Enable/disable global cleaner
const toggleGlobalCleaner = () => {
  const isEnabled = (globalSymbolCleaner as any).isEnabled;
  
  if (isEnabled) {
    globalSymbolCleaner.stop();
    console.log('🛑 Global symbol cleaner disabled');
  } else {
    globalSymbolCleaner.start();
    console.log('✅ Global symbol cleaner enabled');
  }
  
  return !isEnabled;
};

// Export to window for console access
if (typeof window !== 'undefined') {
  (window as any).cleanSymbolsNow = cleanSymbolsNow;
  (window as any).testSymbolCleaning = testSymbolCleaning;
  (window as any).toggleGlobalCleaner = toggleGlobalCleaner;
  
  console.log(`
🧹 Symbol Cleaner Console Utilities Available:

• cleanSymbolsNow() - Clean all symbols on current page
• testSymbolCleaning(text) - Test cleaning on specific text
• toggleGlobalCleaner() - Enable/disable automatic cleaning

Example usage:
  cleanSymbolsNow()
  testSymbolCleaning("Text with ◊ symbols ●")
  toggleGlobalCleaner()
  `);
}

export { cleanSymbolsNow, testSymbolCleaning, toggleGlobalCleaner };
