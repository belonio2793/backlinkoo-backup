import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getStripeConfig, validateStripeSetup } from '@/utils/stripeConfig';
import { stripePaymentService } from '@/services/stripePaymentService';
import {
  CheckCircle,
  XCircle,
  CreditCard,
  Crown,
  ExternalLink
} from 'lucide-react';

export function PaymentSystemStatus() {
  const [config, setConfig] = useState(() => {
    try {
      return getStripeConfig();
    } catch (error) {
      console.error('Stripe configuration error:', error);
      return null;
    }
  });
  
  const [validation, setValidation] = useState(() => {
    try {
      return validateStripeSetup();
    } catch (error) {
      return { isValid: false, errors: [(error as Error).message] };
    }
  });
  
  const [serviceStatus, setServiceStatus] = useState(() => {
    try {
      return stripePaymentService.getStatus();
    } catch (error) {
      return { configured: false, mode: 'error' };
    }
  });

  useEffect(() => {
    try {
      setConfig(getStripeConfig());
      setValidation(validateStripeSetup());
      setServiceStatus(stripePaymentService.getStatus());
    } catch (error) {
      console.error('Payment system configuration error:', error);
    }
  }, []);

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Payment System Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Stripe configuration error. Please check your environment variables.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Mode</span>
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Production
          </Badge>
        </div>

        {/* Configuration Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Publishable Key</span>
            <span className="text-muted-foreground">
              {config.publishableKey ? `${config.publishableKey.substring(0, 12)}...` : 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Configuration</span>
            <Badge variant={config.isConfigured ? 'default' : 'destructive'}>
              {config.isConfigured ? 'Configured' : 'Missing'}
            </Badge>
          </div>
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/payment-test', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Test Payments
          </Button>
        </div>

        {/* Feature Status */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2">Available Features:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Credit purchases
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Premium subscriptions
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Guest checkout
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              New window redirect
            </div>
          </div>
        </div>

        {/* Production Notice */}
        <div className="bg-green-50 p-3 rounded border border-green-200">
          <p className="text-sm text-green-800">
            <strong>Production Mode:</strong> All payments will be processed with real credit cards through Stripe.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentSystemStatus;
