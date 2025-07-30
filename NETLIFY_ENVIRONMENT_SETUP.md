# Netlify Environment Variables Setup

This application requires specific environment variables to be configured in Netlify for full functionality.

## Required Environment Variables

### OpenAI API Configuration
- **Variable Name**: `VITE_OPENAI_API_KEY`
- **Description**: OpenAI API key for AI content generation
- **Required**: Yes (for backlink generator functionality)
- **Format**: `sk-proj-...` (starts with sk-proj- followed by the key)
- **Where to get**: https://platform.openai.com/api-keys

### Supabase Configuration (Already configured)
- **VITE_SUPABASE_URL**: Already set in .env
- **VITE_SUPABASE_ANON_KEY**: Already set in .env

## How to Configure in Netlify

1. **Access Netlify Dashboard**
   - Go to your Netlify site dashboard
   - Navigate to: Site settings > Environment variables

2. **Add Environment Variables**
   ```
   Key: VITE_OPENAI_API_KEY
   Value: [Your OpenAI API key here]
   Scopes: All deploy contexts (or specify as needed)
   ```

3. **Deploy and Test**
   - After adding the environment variable, trigger a new deployment
   - The application will automatically use the Netlify environment variables

## Security Best Practices

✅ **DO:**
- Store all API keys as Netlify environment variables
- Use different keys for different environments (staging/production)
- Regularly rotate API keys
- Monitor API usage and costs

❌ **DON'T:**
- Commit API keys to the codebase
- Store sensitive credentials in .env files in the repository
- Share API keys in plain text

## Verification

After deployment, check the browser console:
- ✅ Success: "OpenAI API key configured successfully from environment variables"
- ❌ Missing: "OpenAI API key not configured. Set VITE_OPENAI_API_KEY in Netlify..."

## Troubleshooting

**Issue**: Content generator not working
**Solution**: Verify the OpenAI API key is:
1. Set in Netlify environment variables
2. Valid and active in OpenAI dashboard
3. Has sufficient credits/billing configured

**Issue**: "Invalid API key" errors
**Solution**: 
1. Check the API key format (should start with `sk-proj-`)
2. Verify the key is active in OpenAI dashboard
3. Redeploy after updating the environment variable

## Development vs Production

- **Development**: Use DevServerControl tool to set environment variables temporarily
- **Production**: Always use Netlify environment variables for security
- **Local Testing**: Environment variables set via DevServerControl are temporary and safe
