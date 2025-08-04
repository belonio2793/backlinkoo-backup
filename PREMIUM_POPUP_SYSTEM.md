# Premium Plan Popup System

A comprehensive, reusable popup system for handling premium plan upgrades throughout the application. The system manages user authentication, account creation, and Stripe checkout integration with automatic redirect to dashboard upon successful payment.

## 🎯 Features

- **Multi-step flow**: Plan selection → Authentication (if needed) → Checkout → Success
- **User state awareness**: Automatically adapts based on authentication status
- **Account creation & sign-in**: Integrated auth forms for new and existing users
- **Stripe integration**: Secure payment processing with fallback support
- **Auto-redirect**: Redirects to `/dashboard` after successful payment
- **Global availability**: Can be triggered from any component in the app
- **Premium status detection**: Prevents showing upgrade prompts to premium users

## 🚀 Quick Start

### 1. The popup is already integrated into your app via `App.tsx`

The `PremiumPopupProvider` wraps your entire application, making the popup available globally.

### 2. Basic Usage - Trigger the Popup

```tsx
import { useOpenPremiumPopup } from '@/components/PremiumPopupProvider';

function MyComponent() {
  const { openPremiumPopup, isPremium } = useOpenPremiumPopup();

  if (isPremium) {
    return <div>User is already premium!</div>;
  }

  return (
    <button onClick={() => openPremiumPopup('user@example.com')}>
      Upgrade to Premium
    </button>
  );
}
```

### 3. Using Pre-built Trigger Buttons

```tsx
import { 
  UpgradeToPremiumButton, 
  FeatureLockedButton, 
  GetPremiumButton 
} from '@/components/PremiumTriggerButton';

function FeatureCard() {
  return (
    <div>
      <h3>Advanced Analytics</h3>
      <p>Get detailed insights...</p>
      
      {/* Use pre-built buttons that handle premium detection */}
      <FeatureLockedButton featureName="Advanced Analytics" />
      
      {/* Or use the main CTA button */}
      <UpgradeToPremiumButton />
      
      {/* Or the simple outline button */}
      <GetPremiumButton />
    </div>
  );
}
```

## 📝 Complete Integration Examples

### Navigation Bar

```tsx
import { useOpenPremiumPopup } from '@/components/PremiumPopupProvider';
import { GetPremiumButton } from '@/components/PremiumTriggerButton';

function NavigationBar() {
  const { isPremium } = useOpenPremiumPopup();

  return (
    <nav className="flex justify-between items-center p-4">
      <div className="logo">My App</div>
      <div className="flex items-center gap-4">
        {isPremium ? (
          <Badge>Premium</Badge>
        ) : (
          <GetPremiumButton size="sm" />
        )}
      </div>
    </nav>
  );
}
```

### Feature Card with Lock

```tsx
import { FeatureLockedButton } from '@/components/PremiumTriggerButton';
import { useOpenPremiumPopup } from '@/components/PremiumPopupProvider';

function AdvancedFeatureCard() {
  const { isPremium } = useOpenPremiumPopup();

  return (
    <Card className={!isPremium ? 'opacity-75' : ''}>
      <CardHeader>
        <CardTitle>
          Advanced Analytics
          {!isPremium && <Badge variant="outline">Premium</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Get detailed insights into your performance...</p>
        
        {isPremium ? (
          <Button>View Analytics</Button>
        ) : (
          <FeatureLockedButton featureName="Advanced Analytics" />
        )}
      </CardContent>
    </Card>
  );
}
```

### Usage Limit Component

```tsx
function UsageLimitCard() {
  const { isPremium, openPremiumPopup } = useOpenPremiumPopup();
  const currentUsage = 8;
  const limit = isPremium ? Infinity : 10;
  const isAtLimit = currentUsage >= limit;

  return (
    <Card>
      <CardContent>
        <div className="space-y-3">
          <div>Usage: {currentUsage} / {isPremium ? '∞' : limit}</div>
          
          {isAtLimit && !isPremium && (
            <Alert>
              <AlertDescription>
                You've reached your limit. Upgrade to continue.
              </AlertDescription>
            </Alert>
          )}
          
          {!isPremium && (
            <UpgradeToPremiumButton />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🎨 Available Components

### Core Components

- **`PremiumPlanPopup`**: The main popup component with full flow
- **`PremiumPopupProvider`**: Context provider for global state management
- **`usePremiumPopup`**: Hook for managing popup state
- **`useOpenPremiumPopup`**: Hook for triggering the popup

### Pre-built Trigger Buttons

- **`PremiumTriggerButton`**: Base configurable button component
- **`UpgradeToPremiumButton`**: Large CTA button with gradient styling
- **`FeatureLockedButton`**: Dashed border button for locked features
- **`GetPremiumButton`**: Simple outline button for general upgrades

### Button Variants

```tsx
// Default upgrade button
<PremiumTriggerButton>Upgrade Now</PremiumTriggerButton>

// CTA style with gradient
<PremiumTriggerButton variant="cta">Get Premium</PremiumTriggerButton>

// Feature lock style
<PremiumTriggerButton variant="feature-lock" featureName="Analytics">
  Unlock Analytics
</PremiumTriggerButton>

// Outline style
<PremiumTriggerButton variant="outline">Go Premium</PremiumTriggerButton>
```

## 🔄 User Flow

1. **User clicks upgrade button** anywhere in the app
2. **Plan selection screen** shows monthly/yearly options
3. **Authentication check**:
   - If signed in → Go to checkout
   - If not signed in → Show auth form (sign in / sign up)
4. **Checkout screen** with email and Stripe integration
5. **Processing screen** while payment is being handled
6. **Success screen** with auto-redirect to dashboard

## ⚙️ Configuration

### Popup Behavior

```tsx
// Open popup with specific email
openPremiumPopup('user@example.com');

// Open popup and let user enter email
openPremiumPopup();

// Check if popup would open (returns false if user is premium)
const wasOpened = tryOpenPremiumPopup('user@example.com');
```

### Custom Success Handlers

```tsx
<PremiumPopupProvider 
  onSuccess={() => {
    // Custom logic after successful upgrade
    console.log('User upgraded to premium!');
    // Refresh user data, show celebration, etc.
  }}
>
  <App />
</PremiumPopupProvider>
```

## 🎛️ Advanced Usage

### Conditional Rendering Based on Premium Status

```tsx
function ConditionalContent() {
  const { isPremium } = useOpenPremiumPopup();

  return (
    <div>
      {isPremium ? (
        <PremiumOnlyContent />
      ) : (
        <div>
          <FreeContent />
          <UpgradeToPremiumButton />
        </div>
      )}
    </div>
  );
}
```

### Custom Button Integration

```tsx
function CustomUpgradeArea() {
  const { openPremiumPopup, isPremium } = useOpenPremiumPopup();

  if (isPremium) return null;

  return (
    <div className="upgrade-banner">
      <h3>Unlock More Features!</h3>
      <button 
        onClick={() => openPremiumPopup()}
        className="custom-button"
      >
        Start Free Trial
      </button>
    </div>
  );
}
```

## 🔧 Payment Integration

The system automatically handles:

- **Stripe Checkout**: Redirects to secure Stripe payment page
- **Fallback Payment**: Development mode fallback for testing
- **Success Handling**: Processes successful payments and upgrades user
- **Error Handling**: Shows appropriate error messages for failed payments
- **Redirect**: Automatically redirects to `/dashboard` after success

## 📱 Responsive Design

All components are fully responsive and work on:
- Desktop computers
- Tablets
- Mobile phones

The popup automatically adjusts its layout for smaller screens.

## 🎯 Best Practices

1. **Use the pre-built buttons** instead of custom ones when possible
2. **Check premium status** before showing upgrade prompts
3. **Provide clear feature descriptions** in locked feature cards
4. **Show usage limits** to encourage upgrades naturally
5. **Use appropriate button variants** for different contexts

## 🔍 Example Page

See `/src/components/examples/PremiumPopupUsageExamples.tsx` for a comprehensive demo page showing all usage patterns.

## 🐛 Troubleshooting

### Popup not opening
- Check if user is already premium (`isPremium` status)
- Verify `PremiumPopupProvider` is wrapping your app
- Check console for any JavaScript errors

### Payment not working
- Verify Stripe configuration in environment variables
- Check Supabase functions are deployed
- Test with fallback mode in development

### Redirect not working
- Ensure `/dashboard` route exists and is accessible
- Check for any route guards or authentication redirects

### Styling issues
- All components use Tailwind CSS classes
- Customization can be done via `className` props
- Check for CSS conflicts with existing styles

---

The Premium Popup System provides a complete, production-ready solution for handling premium upgrades throughout your application. It's designed to be easy to use, highly customizable, and fully integrated with your existing authentication and payment systems.
