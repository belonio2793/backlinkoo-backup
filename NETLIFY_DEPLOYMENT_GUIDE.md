# Netlify Deployment Guide for leadpages.org

## Current Status
✅ **DNS**: Correctly pointing to Netlify  
✅ **Functions**: Created and ready for deployment  
✅ **Configuration**: `netlify.toml` properly configured  
✅ **Build**: Successfully completed  
⏳ **Deployment**: In progress...

## Why leadpages.org Shows "Site not found"

The DNS is working perfectly (that's why you see the Netlify error page instead of a DNS error). The issue is that **Netlify doesn't know how to handle `leadpages.org` requests** because our blog functions aren't deployed yet.

## Deployment Methods

### Method 1: Current Automated Deployment
```bash
npm run deploy:build  # Currently running...
```

### Method 2: Manual Netlify CLI Deployment
If the automated deployment doesn't work:

1. **Install Netlify CLI** (if not already installed):
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**:
```bash
netlify login
```

3. **Link to your site**:
```bash
netlify link --id ca6261e6-0a59-40b5-a2bc-5b5481ac8809
```

4. **Deploy**:
```bash
netlify deploy --prod
```

### Method 3: Netlify Dashboard Deployment

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Find your site (ID: `ca6261e6-0a59-40b5-a2bc-5b5481ac8809`)
3. Go to **Deploys** tab
4. Click **Trigger deploy** → **Deploy site**
5. Or connect to your Git repository for automatic deployments

## What Happens After Deployment

Once deployed, the following routing will be active:

### leadpages.org Traffic Routing
```
Request: https://leadpages.org/
├── Netlify receives request
├── Checks Host header: "leadpages.org"
├── Matches condition in netlify.toml
├── Routes to: /.netlify/functions/domain-blog-server
└── Returns: Beautiful blog homepage with articles
```

### Individual Blog Posts
```
Request: https://leadpages.org/blog/essential-lead-generation-strategies-2024
├── Netlify receives request  
├── Matches /blog/* pattern for leadpages.org
├── Routes to: /.netlify/functions/blog-post-server?slug=essential-lead-generation-strategies-2024
└── Returns: Individual blog post page
```

### Admin Interface (unchanged)
```
Request: https://your-admin-domain.com/
├── No Host condition match
├── Falls through to SPA fallback
└── Returns: React admin interface (index.html)
```

## Verification Steps

After deployment completes:

### 1. Check Function Deployment
Visit your Netlify dashboard and verify:
- `domain-blog-server` function is listed
- `blog-post-server` function is listed
- No deployment errors in logs

### 2. Test leadpages.org
```bash
# Should return blog HTML (not 404)
curl -H "Host: leadpages.org" https://your-site.netlify.app/

# Should return blog post HTML
curl -H "Host: leadpages.org" https://your-site.netlify.app/blog/essential-lead-generation-strategies-2024
```

### 3. Browser Test
- Visit `https://leadpages.org` 
- Should see "Leadpages - Expert Insights" homepage
- Should NOT see Netlify 404 error

## Troubleshooting

### If Still Getting 404 After Deployment

1. **Check Function Logs**:
   - Go to Netlify Dashboard → Functions
   - Click on `domain-blog-server`
   - Check logs for errors

2. **Verify Host Header**:
   ```bash
   curl -v https://leadpages.org/
   # Check if Host header is being sent correctly
   ```

3. **Test Function Directly**:
   ```bash
   curl https://your-site.netlify.app/.netlify/functions/domain-blog-server
   # Should return blog HTML
   ```

4. **Check netlify.toml**:
   - Verify Host conditions are exact: `["leadpages.org"]`
   - No extra spaces or typos

### Common Issues

**Issue**: Functions not found  
**Solution**: Re-deploy with `netlify deploy --prod`

**Issue**: Wrong content served  
**Solution**: Check order of redirects in netlify.toml

**Issue**: Still seeing React app  
**Solution**: Clear browser cache, check Host header

## Environment Variables

Ensure these are set in Netlify Dashboard → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SERVICE_ROLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)

## Expected Timeline

- **Deployment**: 2-5 minutes
- **DNS Propagation**: Already complete ✅
- **Function Cold Start**: 1-2 seconds (first request)
- **Subsequent Requests**: <500ms

## Success Indicators

✅ **leadpages.org loads without errors**  
✅ **Shows "Leadpages - Expert Insights" title**  
✅ **Displays blog content (not admin interface)**  
✅ **Individual blog posts accessible**  
✅ **No more Netlify 404 errors**

---

**Current Deployment Status**: The automated deployment is running. If it takes more than 10 minutes, try Manual Method 2 above.
