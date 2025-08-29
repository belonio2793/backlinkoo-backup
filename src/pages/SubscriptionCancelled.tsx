import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const SubscriptionCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-800 mb-2">
              Subscription Cancelled
            </CardTitle>
            <p className="text-yellow-700">
              Your subscription process was cancelled
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No charges were made to your account. You can try subscribing again anytime.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-yellow-200">
              <div className="text-center space-y-2">
                <p className="font-medium">Still interested in Premium?</p>
                <p className="text-sm text-muted-foreground">
                  Get full access to keyword research, rank tracking, and automated campaigns for just $29/month
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionCancelled;
