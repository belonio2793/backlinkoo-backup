# Backlinkoo - Comprehensive Blog Management Platform

A powerful, AI-enabled blog management platform with integrated MCP services, Netlify deployment, and Supabase backend.

## 🌟 Features

- **AI-Powered Content Generation** - OpenAI integration for automatic blog post creation
- **Admin Dashboard** - Complete management interface for blogs, users, and analytics
- **Authentication System** - Secure user authentication via Supabase
- **Email Integration** - Automated email campaigns via Resend
- **Payment Processing** - Stripe integration for premium features
- **CDN Optimization** - Cloudflare integration for performance
- **Real-time Database** - Supabase for data storage and real-time updates

## 🔗 MCP Integrations

This project is fully integrated with MCP (Model Context Protocol) services:

- **Netlify MCP** - Deployment, functions, and environment management
- **Supabase MCP** - Database operations and authentication
- **GitHub MCP** - Repository management and CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- GitHub account
- Netlify account
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/belonio2793/backlinkoo-backup.git
   cd backlinkoo-backup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Test configuration**
   ```bash
   npm run credentials:test
   npm run sync:validate
   ```

5. **Start development server**
   ```bash
   npm run dev
   # or for Netlify dev environment
   npm run dev:netlify
   ```

## 📋 Available Commands

### Development
- `npm run dev` - Start Vite development server
- `npm run dev:netlify` - Start Netlify dev server with functions
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Database Management
- `npm run supabase:status` - Check Supabase connection
- `npm run supabase:sync` - Sync database schema
- `npm run supabase:types` - Generate TypeScript types

### Credentials Management
- `npm run credentials:test` - Test all credentials
- `npm run credentials:list` - List configured credentials
- `npm run credentials:encode <value>` - Encode a new credential

### Deployment & Sync
- `npm run deploy:netlify` - Deploy to Netlify
- `npm run sync:all` - Sync all configurations
- `npm run sync:health` - Check system health

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **TanStack Query** for data management

### Backend Services
- **Netlify Functions** (19 active functions)
- **Supabase** for database and auth
- **OpenAI API** for content generation
- **Resend** for email services
- **Stripe** for payments
- **Cloudflare** for CDN

### Netlify Functions

| Function | Purpose |
|----------|---------|
| `api-status` | System health monitoring |
| `generate-openai` | AI content generation |
| `global-blog-generator` | Blog post management |
| `send-email` | Email notifications |
| `claim-post` | Post claiming system |
| `cleanup-expired-posts` | Database maintenance |

## 🔧 Configuration

### Environment Variables

All environment variables are managed through Netlify and synchronized across environments:

```bash
# Required Variables
VITE_SUPABASE_URL=https://dfhanacsmsvvkpunurnp.supabase.co
SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_key
RESEND_API_KEY=your_resend_key
STRIPE_SECRET_KEY=your_stripe_key
```

### Database Schema

The application uses several core tables:
- `profiles` - User profiles and roles
- `blog_posts` - Blog content and metadata
- `campaigns` - Marketing campaigns
- `premium_subscriptions` - Paid subscriptions

## 🌐 Deployment

### Automatic Deployment (Recommended)

The project is configured for automatic deployment via GitHub integration:

1. Push changes to the `main` branch
2. Netlify automatically builds and deploys
3. Environment variables are synchronized
4. Functions are updated

### Manual Deployment

```bash
# Build and deploy
npm run build
npm run deploy:netlify

# Or use the Netlify MCP command
npx -y @netlify/mcp@latest --site-id ca6261e6-0a59-40b5-a2bc-5b5481ac8809
```

## 🔍 Monitoring & Health Checks

### System Health
```bash
npm run sync:health
```

### Integration Status
```bash
node mcp-integration-manager.js check
```

### Function Monitoring
- Visit: https://app.netlify.com/projects/backlinkoo/logs/functions
- API Status: https://backlinkoo.com/api/api-status

## 🎯 MCP Integration Status

| Service | Status | Configuration |
|---------|--------|---------------|
| Netlify | ✅ Active | Site ID: ca6261e6-0a59-40b5-a2bc-5b5481ac8809 |
| Supabase | ✅ Connected | Project: dfhanacsmsvvkpunurnp |
| GitHub | ✅ Integrated | Repo: belonio2793/backlinkoo-backup |
| OpenAI | ✅ Configured | API key configured |
| Resend | ✅ Configured | Email system active |
| Stripe | ✅ Configured | Payment processing ready |
| Cloudflare | ✅ Configured | CDN optimization active |

## 🔐 Security

- Environment variables stored securely in Netlify
- Row Level Security (RLS) policies in Supabase
- API key rotation supported
- HTTPS everywhere
- Content Security Policy headers

## 📊 Analytics & Monitoring

- Real-time user analytics
- Function execution monitoring
- Database performance tracking
- Email delivery tracking
- Payment processing monitoring

## 🛠️ Development Workflow

1. **Local Development**
   ```bash
   npm run dev:netlify
   ```

2. **Test Changes**
   ```bash
   npm run credentials:test
   npm run sync:validate
   ```

3. **Deploy**
   ```bash
   git push origin main
   # Automatic deployment via GitHub integration
   ```

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Project Dashboard](https://app.netlify.com/projects/backlinkoo)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**🎉 Status: All systems operational and fully integrated!**

For support or questions, contact the development team.
