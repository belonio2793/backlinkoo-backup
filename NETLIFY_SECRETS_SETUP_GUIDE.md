# Netlify Secrets Setup Guide

## Overview
To enable domain management functionality, you need to configure Netlify API credentials as secrets in your Supabase edge functions.

## Required Environment Variables

### 1. NETLIFY_ACCESS_TOKEN
- **Purpose**: Authenticates API requests to Netlify
- **Type**: Personal Access Token
- **Required**: Yes

**How to get it:**
1. Go to [Netlify User Settings → Applications](https://app.netlify.com/user/applications#personal-access-tokens)
2. Click "New access token"
3. Give it a descriptive name like "Domain Management API"
4. Copy the generated token
5. **Important**: Save this token securely - you won't be able to see it again

### 2. NETLIFY_SITE_ID
- **Purpose**: Identifies which Netlify site to manage domains for
- **Type**: Site identifier string
- **Required**: Yes
- **Default Value**: `ca6261e6-0a59-40b5-a2bc-5b5481ac8809`

**How to get it:**
1. Go to your Netlify site dashboard
2. Go to Site settings → General
3. Copy the "Site ID" value
4. Or use the default value provided above

## Setup Instructions

### Step 1: Configure Supabase Secrets

1. **Open Supabase Functions Secrets**
   - Go to: https://supabase.com/dashboard/project/dfhanacsmsvvkpunurnp/functions/secrets
   - Login to your Supabase account if needed

2. **Add Environment Variables**
   - Click "Add new secret"
   - Add each variable:
     
     **Variable 1:**
     - Name: `NETLIFY_ACCESS_TOKEN`
     - Value: `[your Netlify personal access token]`
     
     **Variable 2:**
     - Name: `NETLIFY_SITE_ID`
     - Value: `ca6261e6-0a59-40b5-a2bc-5b5481ac8809`

3. **Save Changes**
   - Click "Save" for each variable
   - The edge functions will automatically use these secrets

### Step 2: Test Configuration

1. **Visit the Domains Page**
   - Go to `/domains` in your application
   - You should see a configuration helper at the top

2. **Run Configuration Test**
   - Click "Test Configuration" in the helper
   - This will verify your secrets are working

3. **Expected Results**
   - ✅ Token OK - Your access token is valid
   - ✅ Site ID OK - Can access the specified site
   - ✅ Function OK - Edge function can communicate with Netlify

## Troubleshooting

### Error: "No API key found in request"
- **Cause**: NETLIFY_ACCESS_TOKEN not configured
- **Solution**: Add the token to Supabase secrets as described above

### Error: "Site not found"
- **Cause**: Invalid or incorrect NETLIFY_SITE_ID
- **Solution**: Verify the site ID in your Netlify dashboard

### Error: "Authentication failed"
- **Cause**: Invalid or expired access token
- **Solution**: Generate a new token in Netlify and update the secret

### Edge Function Not Working
- **Cause**: Secrets not properly saved or deployed
- **Solution**: 
  1. Check that secrets are saved in Supabase
  2. Wait a few minutes for deployment
  3. Test again with the configuration helper

## Security Notes

- **Never commit tokens to code**: Always use environment variables/secrets
- **Token Permissions**: The access token needs site management permissions
- **Regular Rotation**: Consider rotating access tokens periodically
- **Minimum Permissions**: Use tokens with only the necessary permissions

## Testing Your Setup

Once configured, you can test the integration:

1. **Domain Sync**: Try adding a domain to see if it appears in Netlify
2. **DNS Instructions**: Check if DNS setup instructions are generated
3. **Validation**: Test domain validation functionality

## Support

If you continue having issues:

1. Check the browser console for detailed error messages
2. Verify the Supabase edge function logs
3. Ensure your Netlify account has proper permissions
4. Contact support with specific error messages

## Quick Setup Checklist

- [ ] Generated Netlify personal access token
- [ ] Added NETLIFY_ACCESS_TOKEN to Supabase secrets
- [ ] Added NETLIFY_SITE_ID to Supabase secrets
- [ ] Tested configuration with the helper
- [ ] Verified domain functionality works

---

**Next Steps**: After setup is complete, you can use the enhanced domain manager to add domains to Netlify with automatic DNS configuration instructions.
