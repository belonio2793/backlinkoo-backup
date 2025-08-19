# Domain Blog Themes Integration Setup Guide

This guide walks you through setting up the complete domain blog themes integration with the automation system.

## 🎯 What This Integration Provides

- **Automatic Blog Theme Assignment**: Every domain gets a default theme when blogging is enabled
- **Campaign Integration**: Campaigns automatically publish themed blog posts across your domains
- **Domain Rotation**: Blog posts are distributed across multiple domains for better SEO
- **Custom Themes**: Four professional themes (Minimal, Modern, Elegant, Tech) with full customization
- **Database Tracking**: All blog posts are tracked and linked to campaigns

## 📋 Prerequisites

1. ✅ Working Supabase project
2. ✅ Domains page functional with domain management
3. ✅ Automation system working
4. ⚠️  Supabase service role key (required for setup only)

## 🚀 Setup Instructions

### Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (not the anon key)
4. **Important**: This key has admin privileges - only use for setup

### Step 2: Run Database Setup

Choose one of these methods:

**Method A: Environment Variable (Recommended)**
```bash
# Add to your .env file temporarily
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" >> .env

# Run setup
npm run setup:domains-complete

# Remove from .env file for security
# (or comment it out)
```

**Method B: Inline Environment Variable**
```bash
# Run with inline environment variable
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here npm run setup:domains-complete
```

**Method C: Individual Setup**
```bash
# Setup blog themes
SUPABASE_SERVICE_ROLE_KEY=your_key npm run setup:blog-themes

# Setup campaign blog settings
SUPABASE_SERVICE_ROLE_KEY=your_key npm run setup:campaign-blogs
```

### Step 3: Verify Setup

1. Restart your dev server: `npm run dev`
2. Go to `/domains` page
3. Enable blogging for a domain
4. Verify default theme is assigned
5. Test campaign creation in `/automation`

## 🗄️ Database Tables Created

### `domain_blog_themes`
- Stores theme settings for each domain
- Automatically assigns "Minimal" theme when blogging is enabled
- Supports custom styles and settings

### `campaign_blog_settings`
- Configures blog publishing behavior per campaign
- Default: 2 domains per campaign, auto-publish enabled

### `domain_blog_posts`
- Tracks all published blog posts
- Links posts to campaigns and domains
- Stores theme, content, and metadata

## 🎨 Available Themes

1. **Minimal Clean** - Professional, clean design
2. **Modern Business** - Bold typography, contemporary style
3. **Elegant Editorial** - Sophisticated, publication-inspired
4. **Tech Focus** - Modern tech design with syntax highlighting

## 🔄 How Integration Works

### When You Enable Blogging on a Domain:
1. Default "Minimal" theme is automatically assigned
2. Domain becomes available for campaign publishing
3. Theme can be customized in the domains page

### When You Create a Campaign:
1. Campaign executes normal publishing (Telegraph, etc.)
2. **Additionally**: Publishes themed blog posts to your domains
3. Each domain gets unique content with the same target URL
4. Blog posts use domain-specific themes and styling

### Domain Rotation:
- Campaigns publish to up to 2 domains by default
- Posts are distributed evenly across available domains
- Each post is unique with custom themes

## 🛠️ Customization Options

### Theme Customization
- Colors (primary, accent, background)
- Typography (heading and body fonts)
- Layout settings
- Preview before applying

### Campaign Settings
- Number of domains per campaign
- Preferred domains
- Auto-publish timing
- Blog content variations

## 📊 Monitoring & Analytics

- View all published blog posts in `/blog`
- Track posts per domain in domains page
- Campaign logs show blog publishing status
- Real-time feed updates for blog publishing

## 🚫 Troubleshooting

### "supabaseKey is required" Error
- You need the service role key for setup
- Add SUPABASE_SERVICE_ROLE_KEY to environment

### "Table does not exist" Error
- Database setup didn't complete
- Re-run setup commands
- Check Supabase permissions

### No Blog Posts Created During Campaigns
- Verify domains have blogging enabled
- Check domains are validated (status: active)
- Review campaign logs for errors

### Theme Not Applied
- Check theme is saved in domains page
- Verify domain_blog_themes table exists
- Try reassigning theme

## 🔒 Security Notes

- Service role key is only needed for initial setup
- Remove service role key from .env after setup
- Blog themes and posts use regular user permissions
- RLS policies protect user data

## ✅ Verification Checklist

- [ ] Database tables created successfully
- [ ] Default themes assigned to blog-enabled domains
- [ ] Domain theme customization works
- [ ] Campaign blog publishing active
- [ ] Blog posts appear in domain rotation
- [ ] All database operations use RLS

## 🎉 Next Steps

1. **Enable blogging** on your domains in `/domains`
2. **Customize themes** for each domain
3. **Create campaigns** in `/automation` to test integration
4. **Monitor results** in the blog section and campaign logs

Your domains now have full blog theme integration with the automation system!
