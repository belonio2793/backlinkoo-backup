import { RLSRecursionFixer } from '@/components/RLSRecursionFixer';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmergencyRLSFix = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-800 mb-2">
              Emergency Database Fix
            </h1>
            <p className="text-red-600">
              Fix infinite recursion in database policies
            </p>
          </div>
        </div>

        <RLSRecursionFixer />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Having trouble? Contact support or check the manual instructions above.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => window.open('https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/sql/new', '_blank')}
              variant="outline"
            >
              Open Supabase SQL Editor
            </Button>
            
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Try Dashboard Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyRLSFix;
