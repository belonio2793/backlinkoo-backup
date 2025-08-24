// Clear corrupted Supabase authentication session
console.log('🧹 Clearing corrupted authentication session...');

// Clear all Supabase-related localStorage data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('supabase') || key.includes('auth'))) {
    keysToRemove.push(key);
  }
}

console.log('🔍 Found authentication keys to clear:', keysToRemove);

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Cleared: ${key}`);
});

// Clear sessionStorage as well
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('supabase') || key.includes('auth'))) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  sessionStorage.removeItem(key);
  console.log(`✅ Cleared session: ${key}`);
});

console.log('✅ Authentication session cleared successfully!');
console.log('🔄 Please refresh the page to apply changes.');

// Also clear any cookies related to authentication
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('🍪 Cleared authentication cookies');
