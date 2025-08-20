# How to Fix the Netlify 404 Error

## The Issue
You're getting a 404 error when trying to add domains to Netlify. This happens because:

1. **Missing NETLIFY_ACCESS_TOKEN** - The environment variable needs your real token
2. **Functions might not be deployed** - The Netlify functions need to be accessible

## Step-by-Step Fix

### Step 1: Get Your Netlify Personal Access Token

1. Go to [Netlify Personal Access Tokens](https://app.netlify.com/user/applications/personal)
2. Click "**New access token**"
3. Name it something like "Domain Management"
4. Copy the generated token (starts with `nfp_` and is about 50+ characters)

### Step 2: Set the Environment Variable

Use one of these methods:

**Option A: Using DevServerControl (Recommended)**
```bash
# I can set it for you if you provide the token
# The token should look like: nfp_abc123def456...
```

**Option B: Manual Environment Variable**
Set `NETLIFY_ACCESS_TOKEN=your_actual_token_here` in your environment

### Step 3: Test the Setup

1. **Click the yellow ℹ️ button** next to any domain
2. This will test:
   - ✅ Are Netlify functions deployed?
   - ✅ Is NETLIFY_ACCESS_TOKEN configured?
   - ✅ Can we access your Netlify site?

### Step 4: Add Domain to Netlify

Once the test passes:
1. **Click the purple "Add to Netlify" button** (🌍)
2. Or **Click the green "Add as Custom Domain" button** (🔗)

## What Each Button Does

| Button | Icon | Purpose |
|--------|------|---------|
| **Test Setup** | ℹ️ (Yellow) | Tests if everything is configured correctly |
| **Add to Netlify** | 🌍 (Purple) | Adds domain using domains API |
| **Add Custom Domain** | 🔗 (Green) | Adds domain using custom domain API (recommended) |

## Troubleshooting

### If you get "Functions not deployed"
- The Netlify functions need to be deployed to your site
- Make sure your site is properly connected to this repository

### If you get "NETLIFY_ACCESS_TOKEN not configured"
- You need to provide your actual token (not the placeholder)
- The token should be 50+ characters starting with `nfp_`

### If you get "Site access failed"
- Check that your token has the right permissions
- Verify the site ID is correct: `ca6261e6-0a59-40b5-a2bc-5b5481ac8809`

## Current Status

✅ **Fixed**: Updated code to use correct Netlify API endpoints
✅ **Added**: Better error handling and debugging
✅ **Added**: Pre-flight connectivity checks
⏳ **Needed**: Your real NETLIFY_ACCESS_TOKEN

## Next Steps

1. **Get your Netlify token** from the link above
2. **Let me set the environment variable** with your real token
3. **Test with the yellow button** to verify everything works
4. **Add your domain** with the green button

The 404 error should be completely resolved once we have your real Netlify access token configured!
