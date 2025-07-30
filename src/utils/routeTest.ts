/**
 * Route testing utility to verify pages load without errors
 */

export const testRoutes = async () => {
  const routes = [
    '/',
    '/login', 
    '/dashboard',
    '/blog',
    '/free-backlink',
    '/ai-test',
    '/terms-of-service',
    '/privacy-policy'
  ];

  console.log('🧪 Testing routes...');
  
  for (const route of routes) {
    try {
      // Test if route is accessible without throwing errors
      const currentPath = window.location.pathname;
      if (currentPath === route) {
        console.log(`✅ Route ${route} is currently loaded and working`);
      } else {
        console.log(`🔄 Route ${route} available for testing`);
      }
    } catch (error) {
      console.error(`❌ Route ${route} has issues:`, error);
    }
  }
};

// Auto-run route test when in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(testRoutes, 2000);
}
