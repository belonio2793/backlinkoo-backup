# Backlink ∞ - Developer Reference

A comprehensive backlink management and SEO automation platform built with React, TypeScript, Supabase, and Netlify Functions.

## 🏗️ Architecture Overview

The application follows a modular architecture with strict separation between different functional areas. Each module operates independently with dedicated database tables, services, and UI components to prevent conflicts and ensure scalability.

## 📁 Module Structure

### 1. `/blog` - Content Generation System
**Purpose**: Public content generation with AI-powered blog post creation  
**Route**: `/blog`  
**Access**: Public (anyone can access)

#### Features
- **Keyword-based Content Generation**: Users enter keyword, anchor text, and target URL
- **ChatGPT Integration**: Single prompt submission generates relevant content
- **Content Formatting**: Automatic formatting and SEO optimization
- **Instant Publishing**: Content is immediately published to the blog
- **Subscription Model**: 
  - Unclaimed posts (public, 24-hour expiration)
  - Claimed posts (saved to user dashboard)
  - Guest posts (temporary access)
  - User claimed posts (permanent access for registered users)
  - Premium plan features (unlimited saves, advanced SEO)

#### Database Tables
```sql
-- Main blog content storage
published_blog_posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  slug TEXT UNIQUE,
  title TEXT,
  content TEXT,
  meta_description TEXT,
  anchor_text TEXT,
  target_url TEXT,
  published_url TEXT,
  status TEXT DEFAULT 'published',
  is_trial_post BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  view_count INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  reading_time INTEGER,
  word_count INTEGER,
  tags TEXT[],
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User saved posts for dashboard
user_saved_posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  post_id UUID REFERENCES published_blog_posts(id),
  saved_at TIMESTAMP DEFAULT NOW()
);

-- Fallback table for legacy posts
blog_posts (
  -- Similar structure to published_blog_posts
  -- Used for backward compatibility
);
```

#### Key Services
- `UnifiedClaimService` - Post claiming and user limit management
- `ClaimableBlogService` - Content generation and publishing
- `BlogClaimService` - Specialized claiming logic
- `usePremiumSEOScore` - SEO scoring system

---

### 2. `/dashboard` - Enterprise Campaign Management
**Purpose**: Standard user interface for managing backlink campaigns  
**Route**: `/dashboard`  
**Access**: Authenticated users only

#### Features
- **Credit-based Order Management**: Users purchase credits for campaigns
- **Campaign Creation**: Configure keywords, target URLs, and campaign settings
- **Progress Tracking**: Real-time campaign monitoring
- **Results Management**: View completed campaigns and generated backlinks
- **Analytics Dashboard**: Performance metrics and ROI tracking

#### Database Tables
```sql
-- User campaigns
campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT,
  target_url TEXT,
  keywords TEXT[],
  anchor_texts TEXT[],
  status TEXT DEFAULT 'pending',
  credits_used INTEGER DEFAULT 0,
  total_links_created INTEGER DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign progress tracking
campaign_progress (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  step_name TEXT,
  status TEXT,
  progress_percentage INTEGER DEFAULT 0,
  details JSONB,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User credits management
user_credits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  credits_available INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_purchased INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Key Services
- `CampaignManager` - Campaign lifecycle management
- `CreditSystem` - Credit purchasing and usage tracking
- `ProgressTracker` - Real-time progress monitoring

---

### 3. `/admin` - Administrative Management
**Purpose**: Administrative interface for managing users, campaigns, and reports  
**Route**: `/admin`  
**Access**: Admin users only (role-based)

#### Features
- **User Management**: View and manage user accounts
- **Campaign Oversight**: Monitor all campaigns across the platform
- **Reporting Dashboard**: Generate comprehensive reports for management
- **System Health Monitoring**: Database status, service health, error tracking
- **Content Moderation**: Review and manage blog content

#### Database Tables
```sql
-- Admin roles and permissions
admin_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'admin',
  permissions TEXT[],
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP DEFAULT NOW()
);

-- Admin activity logging
admin_activity_logs (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id),
  action TEXT,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- System monitoring
system_health_metrics (
  id UUID PRIMARY KEY,
  metric_name TEXT,
  metric_value JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

#### Key Services
- `AdminAuthService` - Role-based authentication
- `AdminAuditLogger` - Activity tracking
- `SystemHealthMonitor` - Platform monitoring

---

### 4. `/automation` - Domain Rotation System
**Purpose**: Automated campaign execution with domain rotation  
**Route**: `/automation`  
**Access**: Authenticated users with automation access

#### Features
- **Domain Rotation Management**: Automatically distribute content across domains
- **Sync with /domains**: Real-time synchronization with domain database
- **Automated Link Building**: Create contextual backlinks across domain network
- **Campaign Execution**: Same keyword/anchor/URL logic as /blog but distributed
- **Scheduling System**: Time-based campaign execution

#### Database Tables
```sql
-- Automation campaigns
automation_campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT,
  keywords TEXT[],
  anchor_texts TEXT[],
  target_urls TEXT[],
  domain_rotation_strategy TEXT DEFAULT 'round_robin',
  schedule_config JSONB,
  status TEXT DEFAULT 'pending',
  total_posts_created INTEGER DEFAULT 0,
  domains_used TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Domain rotation tracking
domain_rotation_log (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES automation_campaigns(id),
  domain_id UUID REFERENCES domains(id),
  post_created_at TIMESTAMP,
  post_url TEXT,
  success BOOLEAN DEFAULT false,
  error_message TEXT
);

-- Automation settings
automation_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  max_posts_per_domain_per_day INTEGER DEFAULT 5,
  rotation_delay_hours INTEGER DEFAULT 24,
  content_uniqueness_threshold REAL DEFAULT 0.8,
  settings JSONB
);
```

#### Key Services
- `AutomationEngine` - Campaign execution
- `DomainRotationService` - Domain selection and rotation
- `ContentDistributionService` - Multi-domain content publishing

---

### 5. `/domains` - Private Blog Network
**Purpose**: Domain management for diversified link building  
**Route**: `/domains`  
**Access**: Authenticated users

#### Features
- **Domain Addition**: Users can add their own domains
- **Private Blog Network Creation**: Build diversified link network
- **Automation Sync**: Seamless integration with automation system
- **Domain Health Monitoring**: Check domain status and performance
- **Content Distribution**: Use domains as blogs for contextual links

#### Database Tables
```sql
-- User domains
domains (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  domain_name TEXT UNIQUE,
  domain_authority INTEGER,
  status TEXT DEFAULT 'pending_verification',
  verification_method TEXT,
  verification_token TEXT,
  verified_at TIMESTAMP,
  last_health_check TIMESTAMP,
  health_status TEXT DEFAULT 'unknown',
  blog_theme TEXT DEFAULT 'default',
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Domain blog posts
domain_blog_posts (
  id UUID PRIMARY KEY,
  domain_id UUID REFERENCES domains(id),
  campaign_id UUID REFERENCES automation_campaigns(id),
  title TEXT,
  content TEXT,
  anchor_text TEXT,
  target_url TEXT,
  published_url TEXT,
  published_at TIMESTAMP,
  status TEXT DEFAULT 'published'
);

-- Domain themes and templates
domain_blog_themes (
  id UUID PRIMARY KEY,
  theme_name TEXT UNIQUE,
  template_html TEXT,
  template_css TEXT,
  template_js TEXT,
  preview_image_url TEXT,
  is_premium BOOLEAN DEFAULT false
);
```

#### Key Services
- `DomainManager` - Domain CRUD operations
- `DomainVerificationService` - Domain ownership verification
- `BlogThemeManager` - Theme management for domain blogs

---

### 6. `/backlink-report` - Professional Report Generation
**Purpose**: Generate professional verification reports for SEO services  
**Route**: `/backlink-report`  
**Access**: Public (enhanced features for authenticated users)

#### Features
- **Backlink Verification**: Check if target URLs contain expected backlinks
- **Professional Formatting**: Generate client-ready reports
- **URL Validation**: Verify link placements across multiple URLs
- **Export Options**: PDF, CSV, and HTML report formats
- **Client Sharing**: Shareable public report URLs

#### Database Tables
```sql
-- Backlink reports
backlink_reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  report_name TEXT,
  target_keyword TEXT,
  expected_anchor_text TEXT,
  destination_url TEXT,
  urls_to_verify TEXT[],
  verification_results JSONB,
  report_status TEXT DEFAULT 'pending',
  public_url TEXT,
  generated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verification results
verification_results (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES backlink_reports(id),
  source_url TEXT,
  backlink_found BOOLEAN DEFAULT false,
  anchor_text_match BOOLEAN DEFAULT false,
  destination_url_match BOOLEAN DEFAULT false,
  page_authority INTEGER,
  domain_authority INTEGER,
  additional_metrics JSONB,
  verified_at TIMESTAMP DEFAULT NOW()
);
```

#### Key Services
- `BacklinkVerificationService` - URL verification logic
- `ReportGenerationService` - Professional report formatting
- `URLValidationService` - Link validation and metrics

---

### 7. `/report` - Public URL Validation
**Purpose**: Public tool for verifying destination URLs across multiple sources  
**Route**: `/report`  
**Access**: Public

#### Features
- **Multi-URL Validation**: Check destination URL across multiple source URLs
- **Real-time Verification**: Instant validation results
- **Link Placement Validation**: Verify proper link implementation
- **Public Access**: No authentication required for basic validation
- **Detailed Analysis**: Link context, anchor text analysis

#### Database Tables
```sql
-- Public validation requests
public_validations (
  id UUID PRIMARY KEY,
  session_id TEXT,
  destination_url TEXT,
  source_urls TEXT[],
  validation_results JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- URL analysis cache
url_analysis_cache (
  id UUID PRIMARY KEY,
  url TEXT UNIQUE,
  page_title TEXT,
  meta_description TEXT,
  domain_authority INTEGER,
  page_authority INTEGER,
  outbound_links_count INTEGER,
  last_analyzed TIMESTAMP DEFAULT NOW(),
  analysis_data JSONB
);
```

#### Key Services
- `PublicValidationService` - Public URL validation
- `URLAnalysisService` - Page analysis and metrics
- `LinkDetectionService` - Find and analyze links

---

## 🗄️ Database Architecture

### Core Tables

#### User Management
```sql
-- User profiles
profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  credits_available INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Premium subscriptions
premium_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  plan_type TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS)
All tables implement RLS policies to ensure data isolation:
- Users can only access their own data
- Admin users have elevated permissions
- Public tables allow read access for unauthenticated users

---

## 🚀 Development Guidelines

### Module Independence
- **Strict Separation**: Each module operates independently
- **No Cross-Dependencies**: Modules should not directly import from each other
- **Shared Services**: Common functionality goes in `/src/services/shared/`
- **Database Isolation**: Each module uses dedicated tables

### Code Organization
```
src/
├── pages/
│   ├── Blog.tsx              # /blog route
│   ├── Dashboard.tsx         # /dashboard route
│   ├── AdminDashboard.tsx    # /admin route
│   ├── Automation.tsx        # /automation route
│   ├── Domains.tsx           # /domains route
│   ├── BacklinkReport.tsx    # /backlink-report route
│   └── Report.tsx            # /report route
├── services/
│   ├── blog/                 # Blog-specific services
│   ├── dashboard/            # Dashboard services
│   ├── admin/                # Admin services
│   ├── automation/           # Automation services
│   ├── domains/              # Domain services
│   ├── reports/              # Report services
│   └── shared/               # Shared utilities
├── components/
│   ├── blog/                 # Blog components
│   ├── dashboard/            # Dashboard components
│   ├── admin/                # Admin components
│   └── shared/               # Shared UI components
└── hooks/
    ├── blog/                 # Blog-specific hooks
    ├── dashboard/            # Dashboard hooks
    └── shared/               # Shared hooks
```

### Testing Strategy
- **Unit Tests**: Test individual services and components
- **Integration Tests**: Test module boundaries and data flow
- **E2E Tests**: Test complete user workflows
- **Database Tests**: Verify RLS policies and data integrity

### Error Handling
- **Module-specific Error Boundaries**: Each module handles its own errors
- **Centralized Logging**: All errors logged to monitoring service
- **User-friendly Messages**: Clear error messages for end users
- **Graceful Degradation**: Modules continue working if others fail

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Yarn package manager
- Supabase CLI
- Netlify CLI

### Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (server-side)
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Additional API Keys
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation
```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Build for production
yarn build
```

### Database Setup
```bash
# Link to your Supabase project
supabase link --project-ref your-project-id

# Pull latest schema
yarn supabase:pull

# Generate types
yarn supabase:types
```

---

## 📊 Monitoring and Analytics

### Performance Monitoring
- **Real-time Metrics**: Track page load times and API response times
- **Error Tracking**: Monitor and alert on application errors
- **User Analytics**: Track user behavior and feature usage

### Database Monitoring
- **Query Performance**: Monitor slow queries and optimize
- **Connection Pooling**: Manage database connections efficiently
- **Backup Strategy**: Regular automated backups

---

## 🔐 Security Considerations

### Authentication & Authorization
- **Role-based Access Control**: Different permissions for different user types
- **API Security**: Secure all API endpoints with proper authentication
- **Data Validation**: Validate all inputs on both client and server

### Data Protection
- **Encryption**: Sensitive data encrypted at rest and in transit
- **PII Handling**: Proper handling of personally identifiable information
- **GDPR Compliance**: Data protection and user rights

---

## 📈 Scalability

### Performance Optimization
- **Code Splitting**: Lazy load modules to reduce initial bundle size
- **Caching Strategy**: Implement appropriate caching at all levels
- **CDN Usage**: Serve static assets via CDN

### Database Optimization
- **Indexing Strategy**: Proper indexes for all common queries
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Regular review and optimization of database queries

---

## 🤝 Contributing

### Code Standards
- **TypeScript**: Strict TypeScript for all new code
- **ESLint/Prettier**: Code formatting and linting
- **Conventional Commits**: Standardized commit messages

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Create pull request with detailed description
5. Code review and approval
6. Merge to main

### Module Development
When developing new features:
1. Identify which module the feature belongs to
2. Use module-specific services and components
3. Add appropriate database tables if needed
4. Implement proper error handling
5. Add comprehensive tests
6. Update documentation

---

This architecture ensures each module can be developed, tested, and deployed independently while maintaining a cohesive user experience across the entire platform.
