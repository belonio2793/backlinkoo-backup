# OpenAI API Key Configuration

## Current Status
❌ **No valid OpenAI API key configured** - Content generation will show "Sorry, something went wrong. Please try again."

## To Enable Content Generation

You need to provide a valid OpenAI API key from your OpenAI account:

### Step 1: Get Your API Key
1. Visit https://platform.openai.com/api-keys
2. Sign in to your OpenAI account (or create one)
3. Click "Create new secret key"
4. Copy the generated key (starts with `sk-...`)

### Step 2: Configure the Key
Choose one of these methods:

#### Option A: Environment Variable (Recommended)
```bash
# Set via DevServerControl tool
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

#### Option B: Update .env file
```bash
# Edit .env file and replace the placeholder
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Restart Dev Server
The dev server needs to restart to pick up the new environment variable.

## Error Handling
- **Without API key**: Shows "Sorry, something went wrong. Please try again."
- **With valid API key**: Content generation will work normally
- **Rate limits/quota**: Shows same generic error message

## Security Notes
- Never commit API keys to version control
- Keep your API key secure
- Monitor usage at https://platform.openai.com/usage
- Set billing limits to control costs

## Files Modified
- `src/components/GlobalBlogGenerator.tsx` - Updated error handling to show generic messages
- Environment variables cleared of invalid keys
