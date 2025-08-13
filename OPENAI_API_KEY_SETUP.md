# OpenAI API Key Setup Instructions

## Problem Identified
❌ **OpenAI API Error 401**: The current OpenAI API key in your `.env` file is invalid and returning authentication errors.

## Root Cause
The OpenAI API key in your environment configuration is invalid (returns HTTP 401).

## Solutions (Choose One)

### Option 1: Update Environment Variable (Recommended)
1. **Get a valid OpenAI API key:**
   - Visit https://platform.openai.com/api-keys
   - Sign in to your OpenAI account
   - Click "Create new secret key"
   - Copy the generated key (starts with `sk-...`)

2. **Update your `.env` file:**
   ```bash
   # Replace the invalid key with your new valid key
   VITE_OPENAI_API_KEY=sk-your-new-valid-api-key-here
   ```

3. **Restart the development server:**
   The dev server will automatically pick up the new environment variable.

### Option 2: Use Secure Configuration
1. **Encode your API key:**
   ```bash
   npm run credentials:encode "sk-your-valid-api-key-here"
   ```

2. **Update `src/lib/secure-config.ts`:**
   - Replace the empty `openai_api_key: ''` with your encoded key
   - Example: `openai_api_key: 'c2stcHJvai14eHh4eA=='`

### Option 3: Set Environment Variable via DevServer (Temporary)
This is a temporary solution that won't persist across restarts:
```bash
# The system can set this for you temporarily
```

## Verification
After updating your API key, test it works:

1. **Check the console logs** - you should see:
   ```
   ✅ OpenAI API key configured successfully
   ```

2. **Test content generation** - try generating blog content to ensure the API works.

3. **Monitor for errors** - the 401 authentication errors should be resolved.

## Important Notes
- **Never commit API keys** to version control
- **Keep your API key secret** - treat it like a password
- **Monitor usage** at https://platform.openai.com/usage to avoid unexpected charges
- **Set usage limits** in your OpenAI account to control costs

## Troubleshooting
If you continue to see 401 errors:
1. Double-check the API key has no extra spaces or characters
2. Verify the key is active in your OpenAI dashboard
3. Ensure you have sufficient credits/billing set up
4. Try generating a completely new API key

## Files Modified
- `src/services/api/openai.ts` - Enhanced error handling and fallback logic
- `src/lib/secure-config.ts` - Added comment for OpenAI API key configuration
