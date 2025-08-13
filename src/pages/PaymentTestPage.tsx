/**
 * Payment Test Page
 * Comprehensive payment testing page accessible at /payment-test
 */

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PaymentTesting } from '@/components/PaymentTesting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Shield, TestTube, AlertTriangle } from 'lucide-react';

export default function PaymentTestPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TestTube className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment System Testing</h1>
          <p className="text-gray-600 text-lg">Test all Stripe payment flows and integrations</p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Secure Testing Environment
            </Badge>
            {user ? (
              <Badge variant="default" className="bg-green-600">
                Authenticated User Testing
              </Badge>
            ) : (
              <Badge variant="secondary">
                Guest User Testing
              </Badge>
            )}
          </div>
        </div>

        {/* Warning Alert */}
        <Alert className="mb-8 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Important:</strong> This is a testing environment. Only use Stripe test credit card numbers. 
            Never enter real payment information on this page.
            <div className="mt-2 text-sm">
              Test Card: <code className="bg-orange-100 px-1 rounded">4242 4242 4242 4242</code> | 
              Expiry: Any future date | CVC: Any 3 digits
            </div>
          </AlertDescription>
        </Alert>

        {/* Environment Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Environment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Environment</div>
                <div className="font-semibold text-blue-600">
                  {import.meta.env.VITE_ENVIRONMENT || 'Development'}
                </div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600">Stripe Keys</div>
                <div className="font-semibold text-green-600">
                  {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Configured' : 'Missing'}
                </div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600">User Status</div>
                <div className="font-semibold text-purple-600">
                  {user ? 'Authenticated' : 'Guest'}
                </div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-600">User Email</div>
                <div className="font-semibold text-orange-600 text-xs">
                  {user?.email || 'guest@test.com'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Component */}
        <PaymentTesting />

        {/* Additional Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Testing Guidelines</CardTitle>
            <CardDescription>
              Important information for testing payment flows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-800 mb-2">✅ What to Test</h3>
                <ul className="text-sm space-y-1 text-green-700">
                  <li>• Credit purchase flows (50, 100, 250, 500 credits)</li>
                  <li>• Premium subscription flows (monthly, yearly)</li>
                  <li>• Guest checkout functionality</li>
                  <li>• Payment window opening/closing</li>
                  <li>• Success/cancel page redirects</li>
                  <li>• Configuration validation</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-red-800 mb-2">❌ What NOT to Test</h3>
                <ul className="text-sm space-y-1 text-red-700">
                  <li>• Real credit card numbers</li>
                  <li>• Production payment methods</li>
                  <li>• Large amounts of test transactions</li>
                  <li>• Live webhook endpoints in dev</li>
                  <li>• Production Stripe keys</li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Test Card Numbers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Successful Payment</div>
                  <code className="text-green-600">4242 4242 4242 4242</code>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Card Declined</div>
                  <code className="text-red-600">4000 0000 0000 0002</code>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">Insufficient Funds</div>
                  <code className="text-orange-600">4000 0000 0000 9995</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
