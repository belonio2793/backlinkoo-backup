// Emergency fix for domains page loading issue
// Run this in your browser console when on /domains page

console.log('🚨 Emergency Domains Page Diagnostic');

// Test 1: Check if Supabase client is working
try {
  console.log('1️⃣ Testing Supabase client import...');
  
  if (window.supabase) {
    console.log('✅ Supabase client is available');
  } else {
    console.error('❌ Supabase client not found');
  }
} catch (error) {
  console.error('❌ Supabase client error:', error);
}

// Test 2: Check environment variables
console.log('2️⃣ Checking environment variables...');
console.log('Environment:', {
  VITE_SUPABASE_URL: import.meta?.env?.VITE_SUPABASE_URL ? 'Present' : 'Missing',
  VITE_SUPABASE_ANON_KEY: import.meta?.env?.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
  Mode: import.meta?.env?.MODE || 'Unknown'
});

// Test 3: Check if DomainsPage component exists
console.log('3️⃣ Testing component imports...');
try {
  // This will tell us if the page component can be imported
  const testImport = () => import('/src/pages/DomainsPage.tsx');
  testImport().then(() => {
    console.log('✅ DomainsPage component can be imported');
  }).catch(error => {
    console.error('❌ DomainsPage import failed:', error);
  });
} catch (error) {
  console.error('❌ Component import test failed:', error);
}

// Test 4: Check if we can access the domains table
async function testDatabase() {
  console.log('4️⃣ Testing database access...');
  
  try {
    if (!window.supabase) {
      console.error('❌ No Supabase client available for database test');
      return;
    }
    
    const { data, error } = await window.supabase
      .from('domains')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('❌ Database error:', error.message);
    } else {
      console.log('✅ Database is accessible');
    }
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run database test
testDatabase();

// Test 5: Check current page location
console.log('5️⃣ Page location info:');
console.log('Current URL:', window.location.href);
console.log('Pathname:', window.location.pathname);

// Test 6: Try to manually render a simple component
console.log('6️⃣ Creating simple test component...');

const testDiv = document.createElement('div');
testDiv.innerHTML = `
  <div style="position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 10px; border: 1px solid #ccc; border-radius: 5px; z-index: 9999;">
    <h4>🧪 Domains Page Debug Info</h4>
    <p>Current Path: ${window.location.pathname}</p>
    <p>Supabase: ${window.supabase ? '✅ Available' : '❌ Missing'}</p>
    <p>React: ${window.React ? '✅ Available' : '❌ Missing'}</p>
    <button onclick="this.parentElement.remove()">Close</button>
  </div>
`;

document.body.appendChild(testDiv);

console.log('🎯 Diagnostic complete! Check the debug info box in the top-right corner.');

// If everything looks good, try forcing a page reload
setTimeout(() => {
  console.log('7️⃣ If no critical errors above, trying page reload...');
  // Don't auto-reload, let user decide
  console.log('💡 Try manually refreshing the page or navigating to /domains again');
}, 3000);
