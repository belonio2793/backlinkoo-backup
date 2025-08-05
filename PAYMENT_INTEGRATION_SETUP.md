# Payment Integration Setup Guide

This guide will help you set up Stripe and PayPal payment integration with Netlify environment variables for the Enhanced Unified Payment Modal.

## Overview

The project now uses a single, enhanced payment modal (`EnhancedUnifiedPaymentModal`) that consolidates all payment functionality:

- **Premium Subscriptions** - Monthly/yearly premium plans
- **Credit Purchases** - One-time credit purchases with predefined or custom amounts
- **Dual Payment Methods** - Both Stripe and PayPal support
- **Guest & User Checkout** - Support for both authenticated users and guests
- **Netlify Integration** - Environment variables managed through Netlify

## Features Consolidated

### Previous Components (Now Consolidated):
- ❌ `PremiumCheckoutModal.tsx` 
- ❌ `PricingModal.tsx`
- ❌ `PaymentModal.tsx`
- ❌ `StreamlinedPremiumCheckout.tsx`
- ❌ `PremiumPlanPopup.tsx`

### New Unified Component:
- ✅ `EnhancedUnifiedPaymentModal.tsx` - **Single source of truth**

## Required Environment Variables

### Netlify Site Environment Variables

Set these in your Netlify site dashboard under **Site settings > Environment variables**:

#### Stripe Configuration
```bash
# Frontend (exposed to client)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx...    # Stripe publishable key

# Backend (Netlify functions only)
STRIPE_SECRET_KEY=sk_test_xxxxx...              # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...            # Optional: Webhook verification
```

#### PayPal Configuration
```bash
# Frontend (exposed to client)
VITE_PAYPAL_CLIENT_ID=sb_xxxxx...               # PayPal client ID

# Backend (Netlify functions only)
PAYPAL_CLIENT_ID=sb_xxxxx...                    # PayPal client ID (duplicate for functions)
PAYPAL_SECRET_KEY=xxxxx...                      # PayPal secret key
```

#### Environment Settings
```bash
# Environment detection
VITE_ENVIRONMENT=development                    # Options: development, preview, production
```

## Setup Instructions

### 1. Stripe Setup

1. **Create Stripe Account**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Create account or sign in

2. **Get API Keys**
   - Navigate to **Developers > API Keys**
   - Copy **Publishable key** (starts with `pk_`)
   - Copy **Secret key** (starts with `sk_`)

3. **Create Products & Prices** (Optional)
   - Go to **Products** in Stripe Dashboard
   - Create products for your premium plans
   - Note down the price IDs (e.g., `price_1xxxxx`)

4. **Set Environment Variables in Netlify**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx...
   STRIPE_SECRET_KEY=sk_test_51xxxxx...
   ```

### 2. PayPal Setup

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer](https://developer.paypal.com)
   - Create account or sign in

2. **Create Application**
   - Navigate to **My Apps & Credentials**
   - Click **Create App**
   - Choose **Default Application**
   - Select **Sandbox** for testing

3. **Get Credentials**
   - Copy **Client ID**
   - Copy **Secret**

4. **Set Environment Variables in Netlify**
   ```bash
   VITE_PAYPAL_CLIENT_ID=sb_xxxxx...
   PAYPAL_CLIENT_ID=sb_xxxxx...
   PAYPAL_SECRET_KEY=xxxxx...
   ```

### 3. Netlify Configuration

1. **Access Netlify Dashboard**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Select your site

2. **Navigate to Environment Variables**
   - Go to **Site settings**
   - Click **Environment variables**

3. **Add Variables**
   - Click **Add variable**
   - Enter variable name and value
   - Click **Save**

4. **Deploy Site**
   - Trigger a new deployment to apply changes
   - Environment variables take effect after deployment

## Usage Examples

### 1. SEO Tools Premium Subscription
```typescript
// Already implemented in SEOToolsSection.tsx
<EnhancedUnifiedPaymentModal
  isOpen={isEnhancedPaymentOpen}
  onClose={() => setIsEnhancedPaymentOpen(false)}
  defaultTab="premium"
  redirectAfterSuccess="/dashboard"
  onSuccess={() => {
    // Handle success
    checkSubscriptionStatus();
    toast({ title: "Premium Activated!" });
  }}
/>
```

### 2. Credit Purchase Modal
```typescript
<EnhancedUnifiedPaymentModal
  isOpen={isCreditPurchaseOpen}
  onClose={() => setIsCreditPurchaseOpen(false)}
  defaultTab="credits"
  initialCredits={200}
  onSuccess={() => {
    // Handle success
    refreshUserCredits();
  }}
/>
```

### 3. Guest Checkout
```typescript
<EnhancedUnifiedPaymentModal
  isOpen={isPaymentOpen}
  onClose={() => setIsPaymentOpen(false)}
  defaultTab="credits"
  // User can choose guest checkout in the modal
  onSuccess={() => {
    // Handle guest purchase success
  }}
/>
```

## Technical Implementation

### Backend Integration (Supabase Functions)

The modal integrates with existing Supabase edge functions:

1. **create-payment** - Handles one-time credit purchases
2. **create-subscription** - Handles premium subscription creation

### Frontend Features

1. **Unified Interface**
   - Single modal for all payment types
   - Tabbed interface (Premium vs Credits)
   - Step-by-step flow

2. **Payment Methods**
   - Stripe integration with cards, Apple Pay, Google Pay
   - PayPal integration with PayPal account and PayPal Credit

3. **User Experience**
   - Responsive design
   - Loading states and error handling
   - Success confirmations and redirects

4. **Checkout Options**
   - User account checkout (requires authentication)
   - Guest checkout (email required)
   - Automatic user detection

## Configuration Validation

Use the payment configuration service to validate setup:

```typescript
import { paymentConfigService } from '@/services/paymentConfigService';

// Check configuration
const validation = paymentConfigService.validateConfiguration();
if (!validation.success) {
  console.error('Payment configuration issues:', validation.message);
  console.log('Setup instructions:', paymentConfigService.getConfigurationInstructions());
}

// Test payment methods
const methodTests = await paymentConfigService.testPaymentMethods();
console.log('Stripe available:', methodTests.stripe.available);
console.log('PayPal available:', methodTests.paypal.available);
```

## Security Best Practices

### Environment Variable Security
- ✅ Frontend variables start with `VITE_` prefix
- ✅ Secret keys (without `VITE_`) only accessible in Netlify functions
- ✅ No hardcoded API keys in source code
- ✅ Different keys for development vs production

### Payment Security
- ✅ PCI DSS compliance through Stripe
- ✅ SSL/TLS encryption for all payment data
- ✅ Rate limiting in Netlify functions
- ✅ Input validation and sanitization

## Testing

### Development Testing
1. Use Stripe test keys (start with `pk_test_` and `sk_test_`)
2. Use PayPal sandbox credentials
3. Test with test credit cards and PayPal sandbox accounts

### Payment Testing Cards (Stripe)
```
Visa: 4242424242424242
Mastercard: 5555555555554444
American Express: 378282246310005
Declined: 4000000000000002
```

### Production Deployment
1. Replace test keys with live keys
2. Update PayPal from sandbox to production
3. Set `VITE_ENVIRONMENT=production`
4. Test thoroughly with small amounts

## Troubleshooting

### Common Issues

1. **"Payment method not configured"**
   - Check environment variables are set correctly
   - Ensure deployment includes new variables

2. **"CORS errors"**
   - Verify Netlify functions are deployed
   - Check Supabase function CORS settings

3. **"Invalid API key"**
   - Verify key format and validity
   - Check if using test vs live keys correctly

4. **Payment fails silently**
   - Check browser console for errors
   - Verify webhook endpoints (if using webhooks)

### Debug Configuration
```typescript
// Add to your component for debugging
console.log('Payment config:', paymentConfigService.getConfiguration());
console.log('Available methods:', paymentConfigService.getAvailablePaymentMethods());
```

## Migration from Old Components

If you have existing usage of the old payment modals:

### Replace PremiumCheckoutModal
```typescript
// Old
<PremiumCheckoutModal isOpen={isOpen} onClose={onClose} />

// New
<EnhancedUnifiedPaymentModal 
  isOpen={isOpen} 
  onClose={onClose} 
  defaultTab="premium" 
/>
```

### Replace PricingModal
```typescript
// Old
<PricingModal isOpen={isOpen} onClose={onClose} initialCredits={200} />

// New
<EnhancedUnifiedPaymentModal 
  isOpen={isOpen} 
  onClose={onClose} 
  defaultTab="credits"
  initialCredits={200}
/>
```

### Replace PaymentModal
```typescript
// Old
<PaymentModal isOpen={isOpen} onClose={onClose} />

// New
<EnhancedUnifiedPaymentModal 
  isOpen={isOpen} 
  onClose={onClose} 
  defaultTab="credits"
/>
```

## Support

For issues with payment integration:

1. **Configuration Issues** - Check environment variables
2. **Stripe Issues** - Contact Stripe support or check documentation
3. **PayPal Issues** - Contact PayPal developer support
4. **Netlify Issues** - Check Netlify function logs
5. **Application Issues** - Check browser console and network logs

---

**Next Steps:**
1. Set up environment variables in Netlify
2. Test payment integration in development
3. Update any existing payment modal usage
4. Deploy and test in production
