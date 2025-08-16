import React, { Suspense } from 'react';

// Simple wrapper component that handles loading and errors
function BeautifulBlogPostWrapper() {
  const [component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Dynamic import with error handling
    import('./BeautifulBlogPost')
      .then((module) => {
        setComponent(() => module.BeautifulBlogPost || module.default);
        setLoading(false);
      })
      .catch((importError) => {
        console.error('Failed to load BeautifulBlogPost:', importError);

        // Try loading emergency component
        import('./EmergencyBlogPost')
          .then((emergencyModule) => {
            setComponent(() => emergencyModule.EmergencyBlogPost || emergencyModule.default);
            setLoading(false);
          })
          .catch((emergencyError) => {
            console.error('Failed to load EmergencyBlogPost:', emergencyError);
            setError(`Failed to load blog post component: ${importError.message}`);
            setLoading(false);
          });
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Critical Error</h2>
          <p className="text-gray-700 mb-4">Unable to load blog post component</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  if (!component) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Component Not Found</h2>
          <p className="text-gray-600 mb-4">Blog post component could not be loaded</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const Component = component;
  return <Component />;
}

export default BeautifulBlogPostWrapper;
export { BeautifulBlogPostWrapper };
