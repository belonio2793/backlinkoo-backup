/**
 * Emergency FullStory Disable Script
 * This script can be loaded to immediately disable FullStory if it's causing fetch interference
 */

(function() {
  console.log('🚫 Emergency FullStory disable script loaded');

  // Method 1: Disable FullStory if already loaded
  try {
    if (window.FS && typeof window.FS.shutdown === 'function') {
      window.FS.shutdown();
      console.log('✅ FullStory shutdown complete');
    }
  } catch (e) {
    console.log('ℹ️ FullStory not present or already disabled');
  }

  // Method 2: Block FullStory script loading
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
          const script = node;
          if (script.src && (
            script.src.includes('fullstory') || 
            script.src.includes('fs.js') ||
            script.src.includes('edge.fullstory.com')
          )) {
            console.log('🚫 Blocking FullStory script:', script.src);
            script.remove();
          }
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Method 3: Restore original fetch if it was modified
  if (window.__originalFetch__) {
    console.log('🔄 Restoring original fetch function');
    window.fetch = window.__originalFetch__;
  }

  // Method 4: Prevent FullStory from modifying fetch in the future
  let originalFetch = window.fetch;
  Object.defineProperty(window, 'fetch', {
    get: () => originalFetch,
    set: (newFetch) => {
      // Only allow setting if it's not from FullStory
      const stack = new Error().stack || '';
      if (!stack.includes('fullstory') && !stack.includes('fs.js')) {
        originalFetch = newFetch;
      } else {
        console.log('🚫 Prevented FullStory from modifying fetch');
      }
    },
    configurable: true,
    enumerable: true
  });

  console.log('✅ FullStory protection measures in place');
})();
