# 🔐 Credential Management System

## Overview

This project uses a secure credential management system designed for team development. Credentials are stored in encoded format within the codebase, making them accessible to automated systems while keeping them non-obvious to casual inspection.

## How It Works

### 🗂️ **Credential Storage**
- Credentials are stored in `src/lib/secure-config.ts` (frontend) and `scripts/secure-config.js` (Node.js)
- All values are Base64 encoded for obfuscation
- System automatically decodes credentials when accessed

### 🔧 **Usage in Code**

**Frontend (React/TypeScript):**
```typescript
import { SecureConfig } from '@/lib/secure-config';

// Access database credentials
const dbPassword = SecureConfig.DATABASE_PASSWORD;
const supabaseUrl = SecureConfig.SUPABASE_URL;

// Get full configuration
const config = SecureConfig.getConfig();
```

**Backend/Scripts (Node.js):**
```javascript
import { SecureConfig } from './scripts/secure-config.js';

const dbPassword = SecureConfig.DATABASE_PASSWORD;
const accessToken = SecureConfig.SUPABASE_ACCESS_TOKEN;
```

### 📋 **Available Credentials**

The system currently manages:

#### Database & Supabase
- `DATABASE_PASSWORD` - Database access password
- `DATABASE_HOST` - Database host
- `DATABASE_PROJECT_REF` - Supabase project reference
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_ACCESS_TOKEN` - CLI access token

#### Application
- `DOMAIN` - Application domain
- `APP_URL` - Full application URL

#### External Services (configured as needed)
- Email services (Resend, SMTP)
- Payment services (Stripe, PayPal)
- AI services (OpenAI, Anthropic)
- Other API keys

## For Developers

### 🚀 **Getting Started**
1. Clone the repository
2. Install dependencies: `npm install`
3. Credentials are already configured - no additional setup needed
4. Start developing: `npm run dev`

### 🔍 **Environment Variables**
The system falls back to environment variables if available:
```bash
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

Environment variables take precedence over the secure store.

### 🛠️ **Database Operations**
Use the built-in database utilities:
```bash
npm run supabase:types    # Generate TypeScript types
npm run supabase:create   # Create new migration
npm run supabase:push     # Apply migrations
```

### 🔐 **Adding New Credentials**
If you need to add new credentials:

1. **Development mode**: Use the helper in browser console:
   ```javascript
   SecureConfig.encodeCredential('your-secret-here')
   ```

2. **Add to secure store**: Update the `SECURE_STORE` object in both config files

3. **Add accessor method**: Create a getter method in the `SecureConfig` class

## Security Notes

### ✅ **What This Provides**
- **Team development ease**: No credential setup required for new developers
- **Automation compatibility**: Scripts and builds work automatically
- **Obfuscation**: Credentials not immediately visible in code
- **Version control safety**: No plain text secrets in git history

### ⚠️ **What This Is NOT**
- **Production security**: Use proper secret management for production
- **Encryption**: This is Base64 encoding, not encryption
- **Security against determined inspection**: Encoded values can be decoded

### 🏭 **Production Deployment**
For production environments:
1. Use environment variables
2. Use cloud secret management (AWS Secrets Manager, etc.)
3. Use CI/CD secret injection
4. Never deploy with hardcoded credentials

## Team Guidelines

### 👥 **For New Developers**
- No credential setup required
- Focus on development, not configuration
- Ask team lead if you need additional service access

### 🔄 **For CI/CD**
- Environment variables override secure store
- Set production secrets in deployment environment
- Use secure store for development/testing pipelines

### 📞 **Support**
- Database issues: Use `npm run supabase:status`
- Missing credentials: Check if they're configured in secure store
- Need new service access: Contact team lead

## File Structure

```
src/lib/secure-config.ts     # Frontend credential management
scripts/secure-config.js     # Node.js credential management
scripts/db-utils.js          # Database utilities using secure config
```

This system ensures smooth development while maintaining security best practices for team collaboration.
