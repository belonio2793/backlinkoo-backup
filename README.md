# 🔗 Backlink ∞ - Professional SEO & Backlink Management Platform

A comprehensive backlink building and SEO management platform built with React, TypeScript, and Supabase.

## 🚀 Features

- **Campaign Management** - Create and track backlink campaigns
- **SEO Ranking Tracker** - Monitor keyword rankings across search engines
- **Email Marketing** - Integrated email campaign system
- **Affiliate Program** - Complete affiliate management system
- **Blog Management** - AI-powered blog content generation and management
- **User Authentication** - Secure user registration and login
- **Credit System** - Flexible credit-based pricing model
- **Admin Dashboard** - Comprehensive administrative tools

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Resend + Netlify Functions
- **State Management**: TanStack Query
- **Routing**: React Router
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── admin/          # Admin-specific components
│   ├── affiliate/      # Affiliate program components
│   ├── blog/           # Blog management components
│   └── email/          # Email marketing components
├── pages/              # Page components
├── services/           # Business logic and API services
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
└── integrations/       # Third-party integrations (Supabase)

netlify/
└── functions/          # Serverless functions for email

supabase/
├── functions/          # Database functions
└── migrations/         # Database schema migrations
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backlink-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:8080`

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint

# Database Operations
npm run supabase:types   # Generate TypeScript types from database
npm run supabase:create  # Create new migration
npm run supabase:push    # Apply migrations to database

# Credential Management
npm run credentials:test # Test database credentials
npm run credentials:list # List configured credentials
```

## 🗄️ Database Management

The project uses Supabase with automated migration management:

- **Schema Management**: Database schema is version controlled through migrations
- **Type Safety**: TypeScript types are auto-generated from database schema
- **Secure Credentials**: Development credentials are managed through secure configuration

### Key Database Tables
- `campaigns` - Backlink campaign management
- `profiles` - User profile information
- `credits` - Credit system tracking
- `ranking_targets` - SEO ranking monitoring
- `subscribers` - Email subscription management
- `orders` - Payment and subscription orders

## 🔒 Security & Authentication

- **Supabase Auth**: Secure user authentication with email verification
- **Row Level Security**: Database-level access control
- **Credential Management**: Secure development credential storage
- **CORS Configuration**: Proper cross-origin request handling

## 🌐 Deployment

### Environment Variables

For production deployment, configure these environment variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build Commands

```bash
npm run build            # Standard production build
npm run build:dev        # Development build with source maps
```

### Deployment Platforms

The application is configured to work with:
- **Netlify** (with serverless functions)
- **Vercel**
- **AWS Amplify**
- Any static hosting platform

## 📝 API Documentation

### Supabase Functions

- `create-payment` - Handle payment processing
- `create-subscription` - Manage subscription creation
- `verify-payment` - Payment verification
- `send-email-resend` - Email sending via Resend
- `send-email-smtp` - SMTP email sending

### Netlify Functions

- `send-email` - Email sending functionality

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add your feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code patterns and conventions
- Add proper error handling and validation
- Update documentation for new features
- Test thoroughly before submitting

## 📊 Performance & Monitoring

- **Bundle Analysis**: Built-in bundle optimization
- **Code Splitting**: Automatic route-based code splitting
- **Error Handling**: Comprehensive error boundaries
- **Loading States**: Proper loading and skeleton states

## 🆘 Support & Documentation

- **Database Issues**: Use `npm run credentials:test` to verify connection
- **Type Errors**: Run `npm run supabase:types` to regenerate types
- **Build Issues**: Check console for specific error messages

## 📈 Roadmap

- [ ] Advanced SEO analytics dashboard
- [ ] Multi-language support
- [ ] Advanced affiliate tracking
- [ ] API rate limiting and quotas
- [ ] Enhanced security features
- [ ] Mobile app companion

## 📄 License

This project is proprietary software. All rights reserved.

---

**Backlink ∞** - Professional SEO & Backlink Management Platform
