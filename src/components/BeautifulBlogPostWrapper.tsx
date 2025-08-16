import React from 'react';

// Static import for now to test if it's a dynamic loading issue
const BeautifulBlogPost = React.lazy(() => 
  new Promise((resolve) => {
    setTimeout(() => {
      // Import the actual component
      import('./BeautifulBlogPost').then((module) => {
        resolve({
          default: module.BeautifulBlogPost || module.default
        });
      }).catch((error) => {
        console.error('Failed to load BeautifulBlogPost:', error);
        // Import emergency component as fallback
        return import('./EmergencyBlogPost').then((emergencyModule) => {
          return {
            default: emergencyModule.EmergencyBlogPost || emergencyModule.default
          };
        }).catch(() => {
          // Ultimate fallback if even emergency component fails
          return {
            default: () => (
              <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center p-8">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Critical Error</h2>
                  <p className="text-gray-700 mb-4">
                    Unable to load any blog post components.
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Error: {error.message}
                  </p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Go to Home Page
                  </button>
                </div>
              </div>
            )
          };
        });
      });
    }, 100);
  })
);

export default BeautifulBlogPost;
export { BeautifulBlogPost };
