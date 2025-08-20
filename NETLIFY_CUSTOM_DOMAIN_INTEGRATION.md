# Netlify Custom Domain Integration

This implementation provides a secure way to add custom domains to your Netlify site using the official Netlify API as specified in their documentation.

## Features

- **Official API Implementation**: Uses the PATCH `/sites/{site_id}` endpoint with `custom_domain` field as documented by Netlify
- **Server-side Security**: API calls are made from secure Netlify functions to protect your access token
- **Automatic DNS Instructions**: Provides setup instructions and DNS record recommendations
- **Subdomain Support**: Handles both root domains and subdomains with proper TXT record verification

## Setup

### 1. Configure Environment Variables

Add these environment variables to your Netlify site settings:

```bash
NETLIFY_ACCESS_TOKEN=your_personal_access_token_here
NETLIFY_SITE_ID=your_site_id_here  # Optional, defaults to value in package.json
```

### 2. Generate Netlify Personal Access Token

1. Go to [Netlify Personal Access Tokens](https://app.netlify.com/user/applications/personal)
2. Click "New access token"
3. Give it a descriptive name like "Custom Domain Management"
4. Copy the token and add it to your environment variables

### 3. Get Your Site ID

Your site ID can be found in:
- Netlify dashboard under Site settings > General > Site information
- Already configured in `package.json` as `deploy:netlify` script parameter

## Usage

### In the UI

1. Navigate to `/domains` page
2. Add a domain to your database using the "Add Domain" button
3. Click the green "External Link" button to add it as a custom domain to Netlify
4. Follow the DNS setup instructions provided

### API Endpoints

The server-side function provides these endpoints:

```bash
# Health check
GET /.netlify/functions/netlify-custom-domain?health=check

# Get current site info
GET /.netlify/functions/netlify-custom-domain

# Add custom domain
POST /.netlify/functions/netlify-custom-domain
{
  "domain": "example.com",
  "txt_record_value": "optional_for_subdomains"
}

# Remove custom domain
DELETE /.netlify/functions/netlify-custom-domain
```

## DNS Configuration

### Root Domains (example.com)

Add these DNS records at your domain registrar:

```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600

Type: CNAME  
Name: www
Value: your-site-id.netlify.app
TTL: 3600
```

### Subdomains (blog.example.com)

Add these DNS records:

```
Type: TXT
Name: blog.example.com
Value: netlify-verification-code
TTL: 300

Type: CNAME
Name: blog
Value: your-site-id.netlify.app  
TTL: 3600
```

## How It Works

1. **Client Request**: User clicks "Add to Netlify" button in the domains page
2. **Service Layer**: `NetlifyCustomDomainService` sends request to server function
3. **Server Function**: `netlify-custom-domain.js` makes authenticated API call to Netlify
4. **API Call**: PATCH request to `https://api.netlify.com/api/v1/sites/{site_id}` with `custom_domain` field
5. **Response**: Server returns site data and DNS setup instructions
6. **Database Update**: Domain is marked as `netlify_synced: true` in database

## Security Benefits

- **Token Protection**: Netlify access token never exposed to client-side code
- **Server-side Validation**: Input validation and domain format checking on server
- **CORS Protection**: Proper CORS headers and preflight request handling
- **Error Handling**: Comprehensive error handling and user-friendly messages

## Troubleshooting

### Token Issues
- Verify `NETLIFY_ACCESS_TOKEN` is set in Netlify environment variables
- Check token has correct permissions (Sites: write)
- Use health check endpoint to verify configuration

### DNS Issues
- Allow 5-30 minutes for DNS propagation
- Verify DNS records are correctly configured
- Use DNS lookup tools to confirm records are active

### API Errors
- Check Netlify function logs in Netlify dashboard
- Verify site ID is correct
- Ensure domain format is valid (no http:// or www prefixes)

## Files Created/Modified

### New Files
- `src/services/netlifyCustomDomainService.ts` - Client-side service
- `netlify/functions/netlify-custom-domain.js` - Server-side API handler
- `NETLIFY_CUSTOM_DOMAIN_INTEGRATION.md` - This documentation

### Modified Files  
- `src/pages/DomainsPage.tsx` - Added UI button and integration
- Updated imports and added custom domain functionality

## References

- [Netlify API Documentation](https://developers.netlify.com/guides/adding-your-domain-using-netlify-api/)
- [Netlify Custom Domains Guide](https://docs.netlify.com/domains-https/custom-domains/)
- [Netlify DNS Configuration](https://docs.netlify.com/domains-https/netlify-dns/)
