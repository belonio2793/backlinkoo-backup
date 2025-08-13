# 🚀 Link Building Automation Platform

A beautiful, clean interface for creating and managing automated link building campaigns.

## ✨ Features

- **Campaign Creation**: Create campaigns with keywords, anchor texts, and target URLs
- **Campaign Management**: Start, pause, and monitor your campaigns
- **User-Specific Storage**: Each user's campaigns are securely stored and isolated
- **Real-time Updates**: Live status updates and progress tracking
- **Responsive Design**: Works beautifully on desktop and mobile

## 🎯 How It Works

### Creating a Campaign

1. **Navigate** to `/automation` 
2. **Click** on "Create Campaign" tab
3. **Fill in the form**:
   - **Campaign Name**: A descriptive name for your campaign
   - **Target URL**: The page you want to build links to
   - **Keywords**: Comma-separated list of keywords to target
   - **Anchor Texts**: Comma-separated list of anchor texts to use
   - **Target Links**: Number of backlinks you want to build
4. **Click** "Create Campaign"

### Managing Campaigns

1. **Switch** to "Manage Campaigns" tab
2. **View** all your campaigns with status indicators
3. **Control** campaigns:
   - ▶️ **Start** draft or paused campaigns
   - ⏸️ **Pause** active campaigns  
   - 🗑️ **Delete** campaigns you no longer need

## 🗄️ Database Setup

The automation platform requires a database table to store campaigns.

### Automatic Setup
```bash
npm run automation:setup
```

### Manual Setup
If the automatic setup fails, you can manually create the table:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Run the SQL from `src/database/automation-campaigns-schema.sql`

## 🔐 Security

- **Row Level Security (RLS)** ensures users only see their own campaigns
- **Authenticated Access** required for all campaign operations
- **Secure Database Policies** prevent unauthorized access

## 📊 Campaign Status

| Status | Description | Actions Available |
|--------|-------------|------------------|
| 🟦 **Draft** | Newly created, not started | Start, Delete |
| 🟢 **Active** | Currently running | Pause, Delete |
| 🟡 **Paused** | Temporarily stopped | Start, Delete |
| 🔵 **Completed** | Finished successfully | Delete |

## 🎨 UI Components

The interface is built with:
- **Shadcn/UI** components for consistent design
- **Tailwind CSS** for beautiful styling
- **Lucide Icons** for clear visual indicators
- **Responsive Grid** layouts for all screen sizes

## 🚦 Getting Started

1. **Sign in** to your account
2. **Visit** `/automation`
3. **Create** your first campaign
4. **Start building** backlinks automatically!

## 🛠️ Technical Details

### Database Schema
- **Table**: `automation_campaigns`
- **Key Fields**: name, keywords, anchor_texts, target_url, status
- **Security**: RLS policies for user isolation
- **Performance**: Indexed for fast queries

### Frontend Architecture
- **Component**: `src/pages/Automation.tsx`
- **Hooks**: React hooks for state management
- **API**: Direct Supabase client integration
- **Routing**: Lazy-loaded for optimal performance

---

🎉 **Ready to automate your link building?** Head to `/automation` and create your first campaign!
