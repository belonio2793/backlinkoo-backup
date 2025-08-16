import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export function EmergencyBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    console.log('🚨 Emergency blog post component loaded for slug:', slug);
  }, [slug]);

  const handleRetry = () => {
    setAttempts(prev => prev + 1);
    
    if (attempts < 3) {
      // Try refreshing the page
      window.location.reload();
    } else {
      // After 3 attempts, suggest going home
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-orange-100 rounded-full">
            <AlertTriangle className="h-12 w-12 text-orange-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Content Loading Issue
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          We're having trouble loading the blog post: <strong>{slug}</strong>
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What happened?</h3>
          <p className="text-sm text-blue-800">
            There was a technical issue loading the blog post component. This could be due to:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left">
            <li>• Network connectivity issues</li>
            <li>• Browser extension interference</li>
            <li>• Temporary server issues</li>
            <li>• Browser cache conflicts</li>
          </ul>
        </div>

        {attempts > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              Attempt {attempts} of 3. {attempts >= 3 ? 'Redirecting to home page...' : 'Trying again...'}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleRetry}
            className="flex items-center gap-2"
            disabled={attempts >= 3}
          >
            <RefreshCw className="h-4 w-4" />
            {attempts >= 3 ? 'Redirecting...' : 'Try Again'}
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Home Page
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">For Developers:</h4>
          <p className="text-xs text-gray-600 mb-2">
            Check the browser console for detailed error messages.
          </p>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            Error: Failed to fetch dynamically imported module
          </code>
        </div>
      </div>
    </div>
  );
}

export default EmergencyBlogPost;
