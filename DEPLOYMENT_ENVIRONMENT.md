# Environment Variables Configuration

This document outlines the required environment variables for the Backlinkoo blog widget functionality.

## Required Environment Variables

### Supabase Configuration
```bash
SUPABASE_URL=https://dfhanacsmsvvkpunurnp.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### OpenAI Configuration (for AI content generation)
```bash
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### Resend Configuration (for email notifications)
```bash
RESEND_API_KEY=re_your_resend_api_key_here
```

### Netlify Configuration
```bash
URI=https://backlinkoo.com
```
**Note**: Use `URI` instead of `URL` as `URL` is a reserved environment variable in Netlify.

## Setting Up in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add each environment variable listed above with their respective values

## Setting Up in Local Development

1. Create a `.env` file in your project root
2. Add all the environment variables listed above
3. Make sure `.env` is in your `.gitignore` file

## Important Notes

- **SUPABASE_SERVICE_ROLE_KEY**: This key is used in the cleanup function and has elevated permissions. Keep it secure.
- **SUPABASE_ANON_KEY**: This key is used for client-side operations and public database access.
- **OPENAI_API_KEY**: Required for AI content generation. The system will fall back to template content if not provided.
- **RESEND_API_KEY**: Required for sending email notifications when users claim posts.

## Function-Specific Requirements

### generate-post.js
- SUPABASE_URL
- SUPABASE_ANON_KEY
- OPENAI_API_KEY (optional - fallback content used if not provided)
- URL (for constructing published URLs)

### claim-post.js
- SUPABASE_URL
- SUPABASE_ANON_KEY
- RESEND_API_KEY (optional - claiming works without email notifications)

### cleanup-posts.js
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (required for deleting expired posts)

## Security Best Practices

1. Never commit API keys to your repository
2. Use different keys for development and production environments
3. Regularly rotate your API keys
4. Monitor API usage for unusual activity
5. Use Supabase RLS (Row Level Security) policies to protect data

## Testing Configuration

You can test if your environment variables are properly configured by:

1. Generating a test blog post through the widget
2. Claiming a trial post (requires Resend API key for email)
3. Checking Netlify function logs for any configuration errors
