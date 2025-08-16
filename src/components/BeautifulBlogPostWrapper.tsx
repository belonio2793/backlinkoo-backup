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
        // Return a fallback component
        resolve({
          default: () => (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Loading Error</h2>
                <p className="text-gray-600 mb-4">
                  There was an issue loading the blog post content.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Error: {error.message}
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )
        });
      });
    }, 100);
  })
);

export default BeautifulBlogPost;
export { BeautifulBlogPost };
