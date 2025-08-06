# Google Ads API Setup for Keyword Research

This document explains how to set up the Google Ads API for the keyword research functionality in the application.

## Overview

The application has been updated to use Google's official Ads API for keyword research, providing more accurate and up-to-date search volume data directly from Google. This replaces the previous implementation that relied on third-party APIs.

## Prerequisites

1. A Google account
2. A Google Ads account (you can create one without running ads)
3. A Google Cloud Project
4. Basic understanding of OAuth 2.0

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID

### 2. Enable the Google Ads API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Ads API"
3. Click on it and press "Enable"

### 3. Configure OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type (unless you have a Google Workspace account)
   - Fill in the required information:
     - App name: Your application name
     - User support email: Your email
     - Developer contact information: Your email
   - Add your domain to "Authorized domains" if applicable
   - Save and continue through the scopes (you can skip adding scopes for now)
   - Add test users if needed
4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "Keyword Research App" (or any descriptive name)
   - Authorized redirect URIs: Add your callback URL (e.g., `http://localhost:3000/callback` for development)
5. Download the JSON file containing your client credentials

### 4. Get a Google Ads Developer Token

1. Sign in to your [Google Ads account](https://ads.google.com/)
2. Navigate to "Tools & Settings" > "Setup" > "API Center"
3. Click "Apply for a developer token"
4. Fill out the application form with:
   - Your application details
   - How you plan to use the API
   - Contact information
5. Submit and wait for approval (this can take several days)

**Note:** For development and testing, you can use a basic access level which allows limited API calls.

### 5. Obtain OAuth 2.0 Tokens

You need to generate a refresh token using the OAuth 2.0 flow:

1. **Authorization URL**: Construct the following URL and visit it in your browser:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=https://www.googleapis.com/auth/adwords&access_type=offline&prompt=consent
   ```

2. **Authorization Code**: After authorization, you'll receive an authorization code in the callback URL

3. **Exchange for Tokens**: Use the authorization code to get tokens:
   ```bash
   curl -d "client_id=YOUR_CLIENT_ID" \
        -d "client_secret=YOUR_CLIENT_SECRET" \
        -d "code=YOUR_AUTHORIZATION_CODE" \
        -d "grant_type=authorization_code" \
        -d "redirect_uri=YOUR_REDIRECT_URI" \
        https://oauth2.googleapis.com/token
   ```

4. **Save the Refresh Token**: The response will include a `refresh_token` - save this securely

### 6. Find Your Customer Account ID

1. Log in to your Google Ads account
2. Look at the URL or the account selector in the top right
3. Your Customer ID is the 10-digit number (without dashes)
4. Format: `1234567890` (remove any dashes)

### 7. Configure Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_ADS_CUSTOMER_ACCOUNT_ID=1234567890
GOOGLE_ADS_CLIENT_ID=your_client_id_here
GOOGLE_ADS_CLIENT_SECRET=your_client_secret_here
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_here
```

### 8. Test the Integration

Once configured, the keyword research functionality will automatically use the Google Ads API. You can test it by:

1. Going to the Keyword Research tab in the application
2. Entering a keyword and running a search
3. Checking the console logs for "Google Ads API" messages
4. Verifying that the data quality shows "Official Google Ads API"

## Troubleshooting

### Common Issues

1. **"Invalid developer token"**
   - Ensure your developer token is approved
   - Check that you're using the correct customer account ID

2. **"Authentication failed"**
   - Verify your OAuth credentials are correct
   - Ensure the refresh token is valid and hasn't expired
   - Check that the OAuth consent screen is properly configured

3. **"Customer not found"**
   - Verify your Customer Account ID is correct (10 digits, no dashes)
   - Ensure the account is active and accessible

4. **"Quota exceeded"**
   - You may have hit API rate limits
   - Wait and try again, or consider upgrading your API access level

### Fallback Mechanism

If the Google Ads API fails for any reason, the application will automatically fall back to the previous multi-API approach using:
- DataForSEO API
- SerpAPI  
- AI-powered estimation

This ensures keyword research functionality continues to work even if there are issues with the Google Ads API configuration.

## API Limits and Costs

- **Basic Access**: Limited to a small number of requests per day
- **Standard Access**: Higher limits after approval process
- **Costs**: Google Ads API itself is free, but you need a Google Ads account
- **No Ad Spend Required**: You don't need to run actual ads to use the API

## Security Notes

- Keep your client secret and refresh token secure
- Use environment variables, never commit credentials to version control
- Consider using Google Cloud Secret Manager for production deployments
- Regularly rotate your credentials for security

## Support

If you encounter issues:

1. Check the [Google Ads API documentation](https://developers.google.com/google-ads/api)
2. Review the [OAuth 2.0 setup guide](https://developers.google.com/google-ads/api/docs/oauth/overview)
3. Check the application logs for detailed error messages
4. Ensure all environment variables are properly set

The implementation includes comprehensive error handling and will provide detailed error messages to help with troubleshooting.
