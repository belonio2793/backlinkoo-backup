# Netlify 404 Error Fix Summary

## Issue
Users were encountering a "Failed to add to Netlify: Failed to add domain: 404 . Not Found" error when trying to add domains to Netlify.

## Root Cause Analysis
The error was occurring because the code was using the older Netlify API endpoint:
```
POST /sites/{site_id}/domains
```

This endpoint appears to be deprecated or not available for the site configuration.

## Solution Implemented

### 1. Switch to Official Custom Domain API
Updated the "Add to Netlify" functionality to use the `NetlifyCustomDomainService` which implements the official API approach:
```
PATCH /sites/{site_id}
Content-Type: application/json
{
  "custom_domain": "example.com"
}
```

### 2. Added Connectivity Testing
- Created `netlify-debug.js` function to test Netlify API connectivity
- Added debug button in UI to test connection before attempting domain addition
- Provides detailed error information for troubleshooting

### 3. Enhanced Error Handling
- Added pre-flight connectivity check before domain addition
- Improved error messages with more specific details
- Added console logging for debugging

## Changes Made

### Files Created
- `netlify/functions/netlify-debug.js` - Debug function for testing Netlify API

### Files Modified
- `src/pages/DomainsPage.tsx`:
  - Updated "Add to Netlify" button to use `netlifyCustomDomainService.addCustomDomain()`
  - Changed button condition to use `netlifyCustomDomainService.isConfiguredSync()`
  - Added connectivity pre-check before domain addition
  - Added temporary debug button for testing

## API Endpoint Comparison

### Old Approach (Causing 404)
```javascript
// POST /sites/{site_id}/domains
const response = await fetch(`${baseUrl}/sites/${siteId}/domains`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ domain }),
});
```

### New Approach (Official API)
```javascript
// PATCH /sites/{site_id}
const response = await fetch(`${baseUrl}/sites/${siteId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ custom_domain: domain }),
});
```

## Debugging Steps for Users

1. **Test Connectivity**: Click the yellow info button to test Netlify API connection
2. **Check Debug Info**: Review console output for detailed error information
3. **Verify Configuration**: Ensure NETLIFY_ACCESS_TOKEN is properly set
4. **Check Site ID**: Verify the site ID exists and is accessible

## Expected Behavior Now

1. **Pre-flight Check**: Tests Netlify connectivity before attempting domain addition
2. **Custom Domain API**: Uses the official PATCH endpoint for adding custom domains
3. **Better Errors**: Provides specific error messages if connectivity fails
4. **Setup Instructions**: Shows DNS setup steps after successful domain addition

## Next Steps for Users

1. Click the debug button to test connectivity
2. If connectivity is successful, try adding domain again
3. Follow DNS setup instructions provided after successful addition
4. Remove debug button once functionality is confirmed working

The fix addresses the 404 error by using the correct Netlify API endpoint and provides better debugging capabilities to identify any remaining configuration issues.
