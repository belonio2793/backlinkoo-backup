# Netlify Domain Integration

This implementation adds automatic Netlify domain management to your domain hosting system, enabling SSL/TLS certificate provisioning for custom external domains.

## Features

### 🔧 **Automatic Domain Addition**
- When you add a domain through the interface, it's automatically added to your Netlify site
- Enables Let's Encrypt SSL certificate provisioning
- Shows Netlify sync status in the domain table

### 🌐 **Netlify Status Tracking**
- New "Netlify" column in the domain table shows sync status
- Displays Netlify domain ID for reference
- "Check Status" button to verify domain configuration

### ⚡ **Manual Controls**
- "Add to Netlify" button for domains not yet synced
- Retry functionality for failed operations
- Test connection feature to verify API credentials

### ⚙️ **Configuration Panel**
- Dedicated Netlify configuration card
- Token management interface
- Site ID display and configuration
- Connection status indicator

## Setup Requirements

### 1. **Netlify Personal Access Token**
- Go to [Netlify User Settings → Applications → Personal Access Tokens](https://app.netlify.com/user/applications#personal-access-tokens)
- Generate a new token with site management permissions
- Set the `VITE_NETLIFY_TOKEN` environment variable

### 2. **Site ID**
- Find your Netlify site ID in Site Settings → Site Information
- Already configured as `VITE_NETLIFY_SITE_ID` in your environment

## How It Works

### **When Adding a Domain:**

1. **Database Entry**: Domain is added to your Supabase `domains` table
2. **Netlify Addition**: Domain is automatically added to your Netlify site via API
3. **Status Update**: Domain record is updated with:
   - `netlify_id`: Netlify's internal domain ID
   - `netlify_synced`: Boolean flag indicating sync status
   - `ssl_enabled`: SSL status from Netlify

### **SSL Certificate Flow:**

1. **Domain Added**: Domain is registered with Netlify
2. **DNS Verification**: Netlify checks domain DNS configuration
3. **Certificate Provisioning**: Let's Encrypt SSL certificate is automatically provisioned
4. **Status Updates**: Domain status reflects verification and SSL states

## Domain Status Indicators

### **Netlify Column:**
- 🟢 **Synced**: Domain successfully added to Netlify
- ⚪ **Not synced**: Domain exists only in database
- **ID Display**: Shows first 8 characters of Netlify domain ID

### **Actions Available:**
- **Check Status**: Query current Netlify domain status
- **Add to Netlify**: Manually add unsynchronized domains
- **Auto-Setup**: Full domain configuration including themes

## API Integration

### **NetlifyDomainService Methods:**

```typescript
// Add domain to Netlify site
await netlifyDomainService.addDomain(domain)

// Check domain status
await netlifyDomainService.getDomainStatus(domain)

// List all domains in Netlify site
await netlifyDomainService.listDomains()

// Remove domain from Netlify
await netlifyDomainService.removeDomain(domain)
```

### **Demo Mode:**
- When no valid token is provided, service operates in demo mode
- Simulates API responses for development and testing
- All operations return mock data but don't affect actual Netlify configuration

## Configuration

### **Environment Variables:**
```bash
VITE_NETLIFY_TOKEN=your_netlify_access_token_here
VITE_NETLIFY_SITE_ID=your_site_id_here
```

### **Permissions Required:**
Your Netlify token needs permissions for:
- Site management
- Domain management
- DNS configuration

## Error Handling

### **Common Issues:**

1. **"NETLIFY_ACCESS_TOKEN not set"**
   - Solution: Add your Netlify token to environment variables
   - Demo mode will activate without token

2. **"Failed to add domain: 422"**
   - Domain may already exist in Netlify
   - Check domain ownership and configuration

3. **"DNS verification pending"**
   - Normal state - wait for DNS propagation
   - Update nameservers or DNS records at your registrar

## Benefits

### **For Users:**
- ✅ Automatic SSL certificate provisioning
- ✅ HTTPS support for custom domains
- ✅ No manual Netlify configuration required
- ✅ Real-time status tracking

### **For Developers:**
- ✅ Integrated domain management workflow
- ✅ Error handling and retry mechanisms
- ✅ Demo mode for development
- ✅ Comprehensive status tracking

## Next Steps

1. **Set up your Netlify token** in the configuration panel
2. **Test the integration** using the "Test Connection" button
3. **Add a domain** and watch it automatically sync to Netlify
4. **Monitor SSL status** through the domain status indicators

The integration ensures that all custom domains added through your system will have proper SSL/TLS support through Netlify's infrastructure.
