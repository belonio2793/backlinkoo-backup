/**
 * Usage Examples for Custom Credits Components
 * 
 * This file demonstrates how to use the new CustomCreditsModal and CustomCreditsButton
 * components throughout your application.
 */

import React from "react";
import { CustomCreditsButton, BuyCreditsQuick, BuyCreditsCustom } from "../CustomCreditsButton";
import { CustomCreditsModal } from "../CustomCreditsModal";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const CustomCreditsUsageExamples = () => {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Custom Credits Integration Examples</h2>
        <p className="text-muted-foreground mb-6">
          Here are various ways to integrate the custom credits system with new window checkout.
        </p>
      </div>

      {/* Basic Usage */}
      <Card>
        <CardHeader>
          <CardTitle>1. Basic Custom Credits Button</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Opens modal with $1.4 per credit calculation and new window Stripe checkout.
          </p>
          <CustomCreditsButton />
        </CardContent>
      </Card>

      {/* Pre-filled Amount */}
      <Card>
        <CardHeader>
          <CardTitle>2. Pre-filled Credit Amount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Opens with pre-filled amount (e.g., 250 credits).
          </p>
          <CustomCreditsButton 
            initialCredits={250}
            variant="outline"
          >
            Buy 250 Credits ($350.00)
          </CustomCreditsButton>
        </CardContent>
      </Card>

      {/* Quick Buy Options */}
      <Card>
        <CardHeader>
          <CardTitle>3. Quick Buy Preset Amounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Quick buy buttons for common credit amounts.
          </p>
          <div className="flex gap-3 flex-wrap">
            <BuyCreditsQuick credits={50} />
            <BuyCreditsQuick credits={100} />
            <BuyCreditsQuick credits={250} />
            <BuyCreditsQuick credits={500} />
          </div>
        </CardContent>
      </Card>

      {/* Custom Styled */}
      <Card>
        <CardHeader>
          <CardTitle>4. Custom Styled Button</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Fully customizable button with success callback.
          </p>
          <BuyCreditsCustom 
            variant="default"
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          />
        </CardContent>
      </Card>

      {/* Integration in Forms */}
      <Card>
        <CardHeader>
          <CardTitle>5. Integration in Campaign Forms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Example of integration in campaign creation flow with insufficient credits.
          </p>
          <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800 mb-3">
              ⚠️ You need 50 more credits to run this campaign.
            </p>
            <CustomCreditsButton 
              variant="default"
              size="sm"
              initialCredits={50}
              onSuccess={() => console.log('Credits purchased, refreshing campaign...')}
            >
              Buy 50 Credits to Continue
            </CustomCreditsButton>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>6. Implementation Code Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2">Basic Usage:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto">
{`import { CustomCreditsButton } from '@/components/CustomCreditsButton';

<CustomCreditsButton />
`}
              </pre>
            </div>

            <div>
              <p className="font-medium mb-2">With Pre-filled Amount:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto">
{`<CustomCreditsButton 
  initialCredits={100}
  onSuccess={() => refreshUserCredits()}
>
  Buy 100 Credits ($140.00)
</CustomCreditsButton>`}
              </pre>
            </div>

            <div>
              <p className="font-medium mb-2">Quick Buy Presets:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto">
{`import { BuyCreditsQuick } from '@/components/CustomCreditsButton';

<BuyCreditsQuick credits={250} variant="outline" />`}
              </pre>
            </div>

            <div>
              <p className="font-medium mb-2">Direct Modal Usage:</p>
              <pre className="bg-muted p-3 rounded-md overflow-x-auto">
{`import { CustomCreditsModal } from '@/components/CustomCreditsModal';

const [isOpen, setIsOpen] = useState(false);

<CustomCreditsModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  initialCredits={100}
  onSuccess={() => {
    console.log('Payment successful!');
    setIsOpen(false);
  }}
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Summary */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>$1.4 per credit calculation</strong> - Automatic price calculation</li>
            <li>✅ <strong>New window checkout</strong> - Secure Stripe checkout opens in popup</li>
            <li>✅ <strong>Pre-filled amounts</strong> - Support for initialCredits prop</li>
            <li>✅ <strong>Quick buy presets</strong> - Common amounts (50, 100, 250, 500)</li>
            <li>✅ <strong>Custom amounts</strong> - User can enter any credit amount</li>
            <li>✅ <strong>Success callbacks</strong> - onSuccess prop for post-purchase actions</li>
            <li>✅ <strong>Popup handling</strong> - Graceful handling of blocked popups</li>
            <li>✅ <strong>Loading states</strong> - Clear feedback during checkout process</li>
            <li>✅ <strong>Error handling</strong> - Comprehensive error messages</li>
            <li>✅ <strong>Responsive design</strong> - Works on all screen sizes</li>
            <li>✅ <strong>Accessibility</strong> - Proper ARIA labels and keyboard navigation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomCreditsUsageExamples;
