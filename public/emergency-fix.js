/**
 * Emergency Fix Script - Run in Browser Console
 * 
 * If you're experiencing errors, paste this into the browser console and run it:
 * 
 * JavaScript:
 * fetch('/emergency-fix.js').then(r=>r.text()).then(eval);
 */

(function() {
  console.log('🚨 Emergency Fix Script Started');
  
  // Step 1: Disable FullStory completely
  function disableFullStory() {
    try {
      // Shutdown FullStory if active
      if (window.FS && typeof window.FS.shutdown === 'function') {
        window.FS.shutdown();
        console.log('✅ FullStory shutdown');
      }
      
      // Remove FullStory scripts
      document.querySelectorAll('script[src*="fullstory"], script[src*="fs.js"]').forEach(script => {
        script.remove();
        console.log('🗑️ Removed FullStory script');
      });
      
      // Block FullStory object
      try {
        Object.defineProperty(window, 'FS', {
          value: undefined,
          writable: false,
          configurable: false
        });
      } catch (e) {
        // Ignore if already defined
      }
      
      // Set emergency flag
      localStorage.setItem('disable_fullstory', 'true');
      console.log('✅ FullStory disabled');
      
    } catch (error) {
      console.error('❌ Error disabling FullStory:', error);
    }
  }
  
  // Step 2: Restore clean fetch
  function restoreFetch() {
    try {
      // Check if we have stored original fetch
      if (window.__originalFetch__) {
        window.fetch = window.__originalFetch__;
        console.log('✅ Restored original fetch');
        return;
      }
      
      // Create clean fetch using XMLHttpRequest
      const cleanFetch = function(input, init) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const url = typeof input === 'string' ? input : input.toString();
          const method = (init && init.method) || 'GET';
          
          xhr.open(method, url, true);
          
          // Set headers
          if (init && init.headers) {
            const headers = init.headers;
            if (headers instanceof Headers) {
              headers.forEach((value, key) => {
                xhr.setRequestHeader(key, value);
              });
            } else if (typeof headers === 'object') {
              Object.entries(headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                  xhr.setRequestHeader(key, value);
                }
              });
            }
          }
          
          xhr.onload = () => {
            const headers = new Headers();
            xhr.getAllResponseHeaders().split('\r\n').forEach(line => {
              const [key, ...values] = line.split(':');
              if (key && values.length) {
                headers.set(key.trim(), values.join(':').trim());
              }
            });
            
            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: headers
            });
            resolve(response);
          };
          
          xhr.onerror = () => reject(new TypeError('Network request failed'));
          xhr.ontimeout = () => reject(new TypeError('Network request timed out'));
          
          xhr.send((init && init.body) || undefined);
        });
      };
      
      window.fetch = cleanFetch;
      console.log('✅ Installed clean fetch');
      
    } catch (error) {
      console.error('❌ Error restoring fetch:', error);
    }
  }
  
  // Step 3: Clear problematic storage
  function clearProblematicStorage() {
    try {
      // Clear auth tokens that might be corrupted
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      // Clear any FullStory data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('fullstory') || key.includes('fs.')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ Cleared problematic storage');
    } catch (error) {
      console.error('❌ Error clearing storage:', error);
    }
  }
  
  // Step 4: Run all fixes
  function runEmergencyFix() {
    console.log('🔧 Running comprehensive emergency fix...');
    
    disableFullStory();
    restoreFetch();
    clearProblematicStorage();
    
    console.log('✅ Emergency fix complete');
    console.log('🔄 Reloading page in 2 seconds...');
    
    // Set flag to prevent infinite reload
    if (!localStorage.getItem('emergency_fix_applied')) {
      localStorage.setItem('emergency_fix_applied', 'true');
      setTimeout(() => {
        localStorage.removeItem('emergency_fix_applied');
        window.location.reload();
      }, 2000);
    } else {
      console.log('ℹ️ Emergency fix already applied, skipping reload');
    }
  }
  
  // Make functions available globally
  window.emergencyFix = runEmergencyFix;
  window.disableFullStory = disableFullStory;
  window.restoreFetch = restoreFetch;
  
  // Auto-run if called
  if (window.location.search.includes('emergency=true')) {
    runEmergencyFix();
  } else {
    console.log('🆘 Emergency functions available:');
    console.log('   emergencyFix() - Run complete fix');
    console.log('   disableFullStory() - Disable FullStory only');
    console.log('   restoreFetch() - Restore clean fetch only');
    console.log('');
    console.log('   Or reload with ?emergency=true to auto-run');
  }
  
})();
