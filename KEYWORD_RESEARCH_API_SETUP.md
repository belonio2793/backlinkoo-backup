# Keyword Research API Setup Guide

The keyword research tool currently runs in **demo mode** with sample data. To get real search volumes, competition analysis, and AI insights, you need to configure the following API keys.

## 🚨 Current Status: Demo Mode Active

You're seeing realistic but simulated data including:
- ✅ Keyword variations and suggestions
- ✅ Estimated search volumes (algorithm-based)
- ✅ Competition difficulty estimates
- ✅ CPC estimates
- ✅ SERP results simulation
- ✅ Basic AI insights (local generation)

## 🔧 Required API Keys for Full Functionality

### 1. OpenAI API Key (Priority: High)
**Purpose**: AI-powered keyword insights, content suggestions, and analysis

**How to get it**:
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Go to API Keys section
3. Create a new secret key
4. Copy the key (starts with `sk-`)

**Environment variable**: `OPENAI_API_KEY`
**Cost**: ~$0.01-0.10 per keyword research (very affordable)

### 2. SerpAPI Key (Priority: Medium)
**Purpose**: Real search engine results pages (SERP) analysis

**How to get it**:
1. Sign up at [SerpAPI](https://serpapi.com/)
2. Get your free API key (100 searches/month free)
3. For production: upgrade to paid plan

**Environment variable**: `SERP_API_KEY`
**Cost**: Free tier: 100 searches/month, Paid: $50/month for 5,000 searches

### 3. DataForSEO API (Priority: High)
**Purpose**: Accurate search volumes, keyword difficulty, and CPC data

**How to get it**:
1. Sign up at [DataForSEO](https://dataforseo.com/)
2. Get your login credentials
3. Access their Keywords Data API

**Environment variables**: 
- `DATAFORSEO_API_LOGIN`
- `DATAFORSEO_API_PASSWORD`

**Cost**: Pay-per-use, ~$0.10-0.50 per keyword batch

## 🛠️ Setup Instructions

### For Netlify Deployment

1. **Go to your Netlify dashboard**
2. **Select your site**
3. **Go to Site Settings → Environment Variables**
4. **Add the following variables**:

```bash
OPENAI_API_KEY=sk-your-openai-key-here
SERP_API_KEY=your-serpapi-key-here
DATAFORSEO_API_LOGIN=your-dataforseo-login
DATAFORSEO_API_PASSWORD=your-dataforseo-password
```

5. **Redeploy your site** for changes to take effect

### For Local Development

1. **Create a `.env` file** in your project root (if not exists)
2. **Add the API keys**:

```bash
OPENAI_API_KEY=sk-your-openai-key-here
SERP_API_KEY=your-serpapi-key-here
DATAFORSEO_API_LOGIN=your-dataforseo-login
DATAFORSEO_API_PASSWORD=your-dataforseo-password
```

3. **Restart your development server**: `npm run dev`

### For Other Deployment Platforms

**Vercel**: Add environment variables in Project Settings → Environment Variables
**Heroku**: Use `heroku config:set OPENAI_API_KEY=your-key`
**AWS/Azure/GCP**: Add to your deployment configuration

## 📊 What You Get With Each API

### With OpenAI Only
- ✅ AI-powered keyword analysis
- ✅ Content strategy recommendations
- ✅ Search intent analysis
- ✅ Competitive insights
- ⚠️ Estimated search volumes (not from Google)

### With SerpAPI Added
- ✅ Everything from OpenAI
- ✅ Real competitor analysis
- ✅ Actual top-ranking pages
- ✅ Domain authority insights
- ✅ SERP features analysis

### With DataForSEO Added (Full Power)
- ✅ Everything from above
- ✅ **Real Google search volumes**
- ✅ **Accurate keyword difficulty**
- ✅ **Real CPC data from Google Ads**
- ✅ **Historical trend data**
- ✅ **Multi-location targeting**

## 💰 Cost Breakdown

### Minimal Setup (OpenAI only)
- **Cost**: ~$5-10/month for regular use
- **Features**: AI insights + demo data
- **Good for**: Content planning, strategy

### Recommended Setup (OpenAI + SerpAPI)
- **Cost**: ~$55-60/month
- **Features**: AI insights + real SERP data
- **Good for**: Competitive analysis, SEO research

### Full Setup (All APIs)
- **Cost**: ~$100-150/month depending on usage
- **Features**: Complete professional SEO tool
- **Good for**: Agencies, professional SEO work

## 🔒 Security Best Practices

1. **Never commit API keys** to your repository
2. **Use environment variables** only
3. **Restrict API key permissions** where possible
4. **Monitor API usage** to avoid unexpected costs
5. **Rotate keys regularly** for production apps

## 🚀 Testing Your Setup

After adding API keys:

1. **Go to the Keyword Research tool**
2. **Look for the yellow demo mode banner** - it should disappear
3. **Try searching for a keyword**
4. **Check if the "Multi-API Data" badge appears**
5. **Look for real search volumes** (not round numbers)

## ❓ Troubleshooting

### "Demo Mode" Still Showing
- ✅ Check environment variables are set correctly
- ✅ Redeploy your application
- ✅ Clear browser cache

### API Errors
- ✅ Verify API keys are valid
- ✅ Check API quotas/limits
- ✅ Ensure billing is set up for paid APIs

### High Costs
- ✅ Monitor your API usage dashboards
- ✅ Set up usage alerts
- ✅ Consider API rate limiting

## 🆘 Need Help?

1. **Check the browser console** for specific error messages
2. **Verify API key formats** (OpenAI starts with `sk-`)
3. **Test APIs individually** using their documentation
4. **Contact API providers** if keys aren't working

---

**Note**: The keyword research tool will automatically fall back to demo mode if APIs are unavailable, so your application will always work, even without API keys configured.
