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
  AlertTriangle,
  CreditCard,
  Crown,
  ExternalLink,
  Settings
} from 'lucide-react';

export function PaymentSystemStatus() {
  const [config, setConfig] = useState(getStripeConfig());
  const [validation, setValidation] = useState(validateStripeSetup());
  const [serviceStatus, setServiceStatus] = useState(stripePaymentService.getStatus());

  useEffect(() => {
    setConfig(getStripeConfig());
    setValidation(validateStripeSetup());
    setServiceStatus(stripePaymentService.getStatus());
  }, []);

  const getStatusColor = () => {
    if (config.mode === 'live') return 'bg-green-100 text-green-800';
    if (config.mode === 'test') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = () => {
    if (config.mode === 'live') return <CheckCircle className="h-4 w-4" />;
    if (config.mode === 'test') return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

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
          <span className="font-medium">Current Mode</span>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1 capitalize">{config.mode}</span>
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

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

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

        {/* Instructions */}
        {validation.instructions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Setup Instructions:</h4>
            <ul className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {validation.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ul>
          </div>
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
          
          {config.mode === 'demo' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('https://dashboard.stripe.com/', '_blank')}
            >
              <Settings className="h-4 w-4 mr-1" />
              Get Stripe Keys
            </Button>
          )}
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
      </CardContent>
    </Card>
  );
}

export default PaymentSystemStatus;
