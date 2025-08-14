# Automation System Setup

## Required Environment Variables

To enable the link building automation system, you need to configure the following environment variable in your Netlify site settings:

### OPENAI_API_KEY

This is your OpenAI API key required for content generation.

**How to set it up:**

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new environment variable:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
   - **Scopes**: Functions, Builds

4. Redeploy your site for the changes to take effect

## Getting an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the generated key (it starts with `sk-`)
6. Add it to your Netlify environment variables

## Verifying Setup

After adding the environment variable and redeploying:

1. Go to your automation page (`/automation`)
2. Click on the **Service Status** tab
3. Check that all services show as "ok" status
4. If the Content Generation service shows a warning, verify your API key is correctly set

## Security Notes

- Never commit API keys to your repository
- The OpenAI API key is used server-side only (in Netlify functions)
- API keys are not exposed to the client-side code
- Monitor your OpenAI usage to avoid unexpected charges

## Troubleshooting

### "OpenAI API key not configured" error

- Ensure `OPENAI_API_KEY` is set in Netlify environment variables
- Redeploy your site after adding the environment variable
- Check that there are no extra spaces in the key value

### "Service unavailable" error

- Check your Netlify function logs for detailed error messages
- Ensure your OpenAI account has available credits
- Verify your API key is valid and not expired

### Rate limiting errors

- The system includes automatic rate limiting (1-second delays between requests)
- If you hit OpenAI rate limits, wait a few minutes and try again
- Consider upgrading your OpenAI plan for higher rate limits

## Features

Once properly configured, the automation system provides:

- **Content Generation**: 3 unique 1000-word articles per campaign using GPT-3.5 Turbo
- **Automatic Publishing**: Publishes to Telegraph.ph with embedded backlinks
- **Campaign Management**: Real-time progress tracking and campaign controls
- **Reporting**: Comprehensive analytics and published link tracking
- **Security**: Server-side API key handling with no client-side exposure
