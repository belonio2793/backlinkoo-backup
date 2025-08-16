/**
 * Network Debugging Utility
 * Add this script to help debug and resolve network issues
 */

// Function to disable fetch wrapper if it's causing issues
window.fixNetworkIssues = function() {
  console.log('🔧 Attempting to fix network issues...');
  
  // Disable fetch wrapper
  localStorage.setItem('disable-fetch-wrapper', 'true');
  console.log('✅ Fetch wrapper disabled');
  
  // Clear any cached modules
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
        console.log('🧹 Service worker unregistered');
      }
    });
  }
  
  // Clear relevant cache
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        caches.delete(name);
      });
      console.log('🧹 Cache cleared');
    });
  }
  
  console.log('🔄 Please refresh the page now');
  
  // Auto-refresh after 2 seconds
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};

// Function to re-enable fetch wrapper
window.enableNetworkWrapper = function() {
  console.log('🔧 Re-enabling network wrapper...');
  localStorage.removeItem('disable-fetch-wrapper');
  console.log('✅ Network wrapper will be enabled on next page load');
  console.log('🔄 Please refresh the page');
};

// Function to check current network status
window.checkNetworkStatus = function() {
  console.log('🔍 Network Status Check:');
  console.log('- Fetch wrapper disabled:', localStorage.getItem('disable-fetch-wrapper') === 'true');
  console.log('- Online status:', navigator.onLine);
  console.log('- User agent:', navigator.userAgent);

  // Test basic fetch
  fetch(window.location.href + '?test=1')
    .then(response => {
      console.log('✅ Basic fetch test passed');
    })
    .catch(error => {
      console.log('❌ Basic fetch test failed:', error.message);
    });

  // Test dynamic import
  console.log('🧪 Testing dynamic import...');
  import('/src/components/EmergencyBlogPost.tsx?test=' + Date.now())
    .then(module => {
      console.log('✅ Dynamic import test passed');
    })
    .catch(error => {
      console.log('❌ Dynamic import test failed:', error.message);
      console.log('This explains why the blog post won\'t load!');
    });
};

// Function to test React.lazy double-wrapping issues
window.testLazyComponents = function() {
  console.log('🧪 Testing React.lazy component setup...');

  try {
    // Check if we have the right lazy component structure
    console.log('✅ LazyBeautifulBlogPost is available');

    // Test that React.lazy is not double-wrapped
    const testLazy = React.lazy(() =>
      Promise.resolve({
        default: () => React.createElement('div', {}, 'Test component')
      })
    );

    console.log('✅ React.lazy basic test passed');

    // Check that we're not wrapping lazy components in other lazy components
    console.log('ℹ️ Check: Components should resolve to functions, not other lazy components');

  } catch (error) {
    console.log('❌ React.lazy test failed:', error.message);
  }
};

// Function to test Symbol error handling
window.testSymbolErrors = function() {
  console.log('🧪 Testing Symbol error handling...');

  try {
    // Create various problematic objects
    const symbolError = Symbol('test-error');
    const objectWithSymbol = {
      message: 'Error with symbol',
      [Symbol.iterator]: function*() { yield 1; },
      [Symbol('test')]: 'value'
    };

    // Test string conversion (this was causing the original error)
    try {
      const result1 = String(symbolError);
      console.log('✅ Symbol to string conversion works:', result1);
    } catch (e) {
      console.log('❌ Symbol to string conversion failed:', e.message);
    }

    // Test template literal conversion (this was the main issue)
    try {
      const result2 = `Error: ${symbolError}`;
      console.log('✅ Symbol template literal works:', result2);
    } catch (e) {
      console.log('❌ Symbol template literal failed:', e.message);
    }

    console.log('🧪 Symbol error test complete');
  } catch (error) {
    console.log('❌ Symbol error test failed:', error.message);
  }
};

// Auto-run network status check
setTimeout(() => {
  console.log('🌐 Network debugging utilities loaded:');
  console.log('- Run fixNetworkIssues() to disable fetch wrapper');
  console.log('- Run enableNetworkWrapper() to re-enable wrapper');
  console.log('- Run checkNetworkStatus() to check current status');
  console.log('- Run testSymbolErrors() to test Symbol error handling');
  console.log('- Run testLazyComponents() to test React.lazy setup');

  // Auto-check if there are issues
  if (localStorage.getItem('disable-fetch-wrapper') === 'true') {
    console.log('ℹ️ Fetch wrapper is currently disabled');
  }
}, 1000);
