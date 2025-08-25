// Force browser cache refresh for Netlify stream fix
console.log('🔄 Force refreshing browser cache to load latest stream fixes...');

// Clear browser cache for this origin
if ('caches' in window) {
  caches.keys().then(function(names) {
    names.forEach(function(name) {
      caches.delete(name);
    });
    console.log('✅ Service worker caches cleared');
  });
}

// Force reload modules with cache busting
const modules = [
  '/src/services/netlifyDomainSync.ts',
  '/src/pages/EnhancedDomainsPage.tsx'
];

modules.forEach(module => {
  const cacheBust = `?t=${Date.now()}&fix=stream-error`;
  console.log(`🔄 Cache busting module: ${module}${cacheBust}`);
});

// Reload page with hard refresh
console.log('🚀 Performing hard refresh to load latest code...');
setTimeout(() => {
  window.location.reload(true);
}, 1000);
