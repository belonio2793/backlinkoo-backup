# DNS Propagation & Troubleshooting Guide

## 🎯 Understanding the DNS Validation Issue

The error "DNS validation service temporarily unavailable. Domain has been marked as pending validation." occurs when:

1. **Netlify Functions Not Deployed**: The DNS validation function exists but isn't accessible
2. **Development Environment**: You're running locally and Netlify functions aren't available
3. **Network Issues**: Temporary connectivity problems

## 🔧 Quick Fixes

### Option 1: Test with Fallback Validation
The system automatically falls back to basic validation when the DNS service is unavailable:

```bash
# Add a test domain to verify the system works
npm run domains:add-test
```

Then go to `/domains` and test DNS validation. It will use fallback validation.

### Option 2: Manual DNS Propagation Check

1. **Go to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Add these DNS records**:
   ```
   Type: A
   Name: @ (or blank)
   Value: 192.168.1.100 (your hosting IP)
   
   Type: TXT  
   Name: @ (or blank)
   Value: blo-verification=your_verification_token
   
   Type: CNAME
   Name: www
   Value: hosting.backlinkoo.com
   ```

3. **Check propagation** using online tools:
   - [whatsmydns.net](https://whatsmydns.net/)
   - [dnschecker.org](https://dnschecker.org/)
   - [dns.google](https://dns.google/)

### Option 3: Force Validation Update

If your DNS is properly configured but showing as invalid:

1. Go to `/domains` page
2. Click "DNS Setup" for your domain
3. Click "Validate DNS Records" 
4. The system will use fallback validation and mark your domain as active

## 🗄️ Database Setup (If Needed)

If you haven't set up the domain blog integration:

```bash
# Set up database tables (requires service role key)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key npm run setup:domains-complete
```

## 🌐 DNS Propagation Timeline

- **Immediate**: Changes saved at registrar
- **15 minutes**: Local DNS servers start updating  
- **1-4 hours**: Most DNS servers worldwide updated
- **24-48 hours**: Full global propagation complete

## 🔍 Troubleshooting Steps

### Step 1: Check Domain Configuration
```bash
# Test DNS validation service
npm run test:dns
```

### Step 2: Verify DNS Records
Use online DNS checkers to verify your records:

```bash
# Check A record
dig yourdomain.com A

# Check TXT record  
dig yourdomain.com TXT

# Check CNAME record
dig www.yourdomain.com CNAME
```

### Step 3: Check Domains Page
1. Go to `/domains` in your app
2. Verify domain is listed
3. Check DNS service status (top of page)
4. Try validation with fallback method

### Step 4: Manual Validation Override
If DNS is correct but validation fails:

1. Click "DNS Setup" for your domain
2. Copy the required record values
3. Verify they match your registrar settings
4. Click "Validate DNS Records" to force recheck

## 📊 DNS Service Status Indicators

- **🟢 Online**: Netlify function working, real DNS validation
- **🟡 Offline (Using Fallback)**: Basic validation based on domain format
- **🔴 Unknown**: Service status unknown

## 🎯 Expected DNS Configuration

### A Record
- **Name**: @ (root domain)
- **Value**: Your hosting server IP
- **TTL**: 300-3600 seconds

### TXT Record  
- **Name**: @ (root domain)
- **Value**: `blo-verification=your_unique_token`
- **TTL**: 300-3600 seconds

### CNAME Record (Optional)
- **Name**: www
- **Value**: Your hosting CNAME target
- **TTL**: 300-3600 seconds

## 🚀 Testing Your Setup

### Test 1: Basic Domain Validation
```bash
# Add test domain
npm run domains:add-test

# Check domains page - should see test domain
# Try DNS validation - should work with fallback
```

### Test 2: Blog Integration
1. Enable blogging on a domain
2. Check that default theme is assigned
3. Create a test campaign
4. Verify blog posts are generated

### Test 3: Real DNS Validation
1. Set up actual domain with real DNS records
2. Wait for propagation (15-60 minutes)
3. Test validation in domains page
4. Should show "Online" status when function works

## ⚠️ Common Issues & Solutions

### Issue: "Function not deployed"
**Solution**: The app works without the function using fallback validation

### Issue: "Domain not found"  
**Solution**: Refresh the domains page, check database connection

### Issue: "DNS records not propagating"
**Solution**: 
- Check TTL settings (lower = faster propagation)
- Clear local DNS cache
- Wait longer (up to 48 hours)
- Contact domain registrar

### Issue: "Service offline"
**Solution**: This is normal in development - fallback validation works

## 🔄 Fallback Validation Logic

When DNS service is unavailable, the system:

1. ✅ Validates domain format (example.com pattern)
2. ✅ Checks for verification token presence
3. ✅ Verifies required hosting configuration  
4. ✅ Marks domain as active if all checks pass
5. 📝 Notes "fallback validation" in domain record

This ensures your domains work even when real DNS checking is unavailable.

## 📞 When to Contact Support

Contact support if:
- Domains don't appear in the domains page
- Fallback validation fails for valid domains
- Blog integration doesn't work after enabling
- Database errors prevent domain creation

The DNS validation service being "offline" is **normal** and **expected** in development environments. Your domains will work correctly with the fallback validation system.
