import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PremiumUpgradeButton,
  HeaderUpgradeButton,
  NavigationUpgradeButton,
  ToolsHeaderUpgradeButton,
  SettingsUpgradeButton,
  CompactUpgradeButton
} from '@/components/PremiumUpgradeButton';
import { usePremiumUpgrade } from '@/components/PremiumUpgradeProvider';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { Crown, TestTube } from 'lucide-react';

export function PremiumUpgradeTest() {
  const { openUpgradeModal } = usePremiumUpgrade();
  const { user, isAuthenticated } = useAuth();
  const { isPremium, loading } = usePremium();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Premium Upgrade Test Page</h1>
        </div>
        <p className="text-gray-600">Test all premium upgrade button variants and functionality</p>
      </div>

      {/* User Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Authenticated:</span>
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Email:</span>
            <span className="text-gray-600">{user?.email || "Not signed in"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Premium Status:</span>
            <Badge variant={isPremium ? "default" : "outline"}>
              {loading ? "Loading..." : isPremium ? "Premium" : "Free"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Upgrade Button Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Header Upgrade Button</h3>
            <p className="text-sm text-gray-600">Used in main navigation header</p>
            <HeaderUpgradeButton />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Navigation Upgrade Button</h3>
            <p className="text-sm text-gray-600">Used in navigation areas</p>
            <NavigationUpgradeButton />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Tools Header Upgrade Button</h3>
            <p className="text-sm text-gray-600">Compact button for tools header</p>
            <ToolsHeaderUpgradeButton />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Settings Upgrade Button</h3>
            <p className="text-sm text-gray-600">Large button for settings page</p>
            <SettingsUpgradeButton />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Compact Upgrade Button</h3>
            <p className="text-sm text-gray-600">Small button for inline use</p>
            <CompactUpgradeButton />
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Custom Style Examples</h3>
            <div className="flex flex-wrap gap-3">
              <PremiumUpgradeButton 
                style="primary"
                triggerSource="manual"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              />
              <PremiumUpgradeButton 
                style="gradient"
                triggerSource="manual"
              />
              <PremiumUpgradeButton 
                style="minimal"
                triggerSource="manual"
              />
              <PremiumUpgradeButton 
                style="badge"
                triggerSource="manual"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context API Test */}
      <Card>
        <CardHeader>
          <CardTitle>Context API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Test the context API for programmatic access to the premium upgrade modal
          </p>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => openUpgradeModal('navigation')}
              variant="outline"
            >
              Open from Navigation
            </Button>
            <Button 
              onClick={() => openUpgradeModal('settings')}
              variant="outline"
            >
              Open from Settings
            </Button>
            <Button 
              onClick={() => openUpgradeModal('manual')}
              variant="outline"
            >
              Open Manual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Modal Flow Test</h3>
            <p className="text-sm text-gray-600">
              Click any upgrade button to test the complete modal flow:
            </p>
            <ul className="text-sm text-gray-600 list-disc pl-6 space-y-1">
              <li>Features overview step</li>
              <li>Plan selection (monthly/yearly)</li>
              <li>Authentication step (if not logged in)</li>
              <li>Checkout step with Stripe integration</li>
              <li>Processing and success states</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Conditional Display</h3>
            <p className="text-sm text-gray-600">
              Premium users should not see upgrade buttons
            </p>
            <Badge variant={isPremium ? "default" : "outline"}>
              {isPremium ? "✓ Upgrade buttons hidden" : "✓ Upgrade buttons visible"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Integration Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">✅ Completed Integrations:</h4>
            <ul className="text-sm text-gray-600 list-disc pl-6 space-y-1">
              <li>Main Header.tsx - Premium upgrade button added</li>
              <li>ToolsHeader.tsx - Compact upgrade button added</li>
              <li>App.tsx - PremiumUpgradeProvider integrated</li>
              <li>Standalone PremiumPlanModal component created</li>
              <li>Independent from campaign limit modals</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium">🎯 Usage Instructions:</h4>
            <ul className="text-sm text-gray-600 list-disc pl-6 space-y-1">
              <li>Import any variant from '@/components/PremiumUpgradeButton'</li>
              <li>Use usePremiumUpgrade() hook for programmatic access</li>
              <li>Modal automatically handles authentication and payment flow</li>
              <li>Integrates with existing Stripe payment system</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PremiumUpgradeTest;
