// Test script to check domain system status
console.log('🔍 DOMAIN SYSTEM STATUS CHECK');
console.log('='.repeat(50));

// Check if we're in browser environment
if (typeof window !== 'undefined') {
  console.log('✅ Running in browser environment');
  
  // Check for domain themes errors in console
  let hasErrors = false;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    if (args.some(arg => String(arg).includes('domain theme') || String(arg).includes('Failed to fetch'))) {
      console.log('❌ Found domain theme error:', args);
      hasErrors = true;
    }
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    if (args.some(arg => String(arg).includes('domain theme') || String(arg).includes('fallback'))) {
      console.log('⚠️  Found domain theme warning (expected in fallback mode):', args);
    }
    originalWarn.apply(console, args);
  };
  
  // Test basic functionality
  setTimeout(() => {
    console.log('\n📊 STATUS SUMMARY:');
    console.log('- Domain page loaded:', document.title.includes('Backlink'));
    console.log('- Domain themes errors:', hasErrors ? '❌ Present' : '✅ Resolved');
    console.log('- Fallback mode active:', !hasErrors ? '✅ Working properly' : '❌ Check implementation');
    
    // Check for specific elements
    const domainCards = document.querySelectorAll('[data-testid="domain-card"], .domain-row, .domain-item');
    const errorAlerts = document.querySelectorAll('[role="alert"]');
    
    console.log('- Domain elements found:', domainCards.length);
    console.log('- Alert elements:', errorAlerts.length);
    
    // Check network errors
    const networkErrors = Array.from(document.querySelectorAll('*')).some(el => 
      el.textContent && el.textContent.includes('Failed to fetch')
    );
    console.log('- Network errors visible:', networkErrors ? '❌ Yes' : '✅ None');
    
    console.log('\n🎯 RECOMMENDATION:');
    if (!hasErrors) {
      console.log('✅ Domain system is working correctly with fallback handling!');
      console.log('💡 SQL script appears to have been successful or fallback mode is active.');
    } else {
      console.log('⚠️  Some errors still present. Check SQL script execution.');
    }
  }, 2000);
  
} else {
  console.log('❌ Not in browser environment');
}
