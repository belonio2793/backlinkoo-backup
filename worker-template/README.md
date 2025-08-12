# Blog Comment Automation Worker

This worker processes jobs from the Supabase jobs queue for the blog comment automation system.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

## Running the Worker

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## What the Worker Does

### Discovery Jobs (`discover`)
- Finds blog URLs with comment capabilities
- Searches for blogs related to campaign keywords
- Stores discovered URLs in `blog_urls_discovery` table
- **Note:** Current version uses demo URLs - integrate with real search APIs

### Comment Posting Jobs (`post_comment`)
- Uses Playwright to automate blog comment submission
- Detects comment forms automatically
- Fills name, email, comment, and website URL fields
- Verifies successful posting
- Handles CAPTCHA detection (flags for manual review)
- Updates backlink records and logs results

## Job Processing Flow

1. **Lock job** from queue (optimistic locking)
2. **Process job** based on type
3. **Update status** (done/failed/retry)
4. **Log results** to campaign logs
5. **Repeat** continuously

## Safety Features

- **CAPTCHA detection** - Stops and flags for manual review
- **Retry logic** - Up to 3 attempts per job
- **Error logging** - Detailed logs for debugging
- **Graceful shutdown** - Handles SIGINT/SIGTERM
- **Rate limiting** - Built-in delays between operations

## Deployment Options

### Local Development
Run directly on your machine for testing

### Cloud Deployment
- **Render/Railway:** Simple Node.js deployment
- **Google Cloud Run:** Containerized deployment
- **AWS ECS/Fargate:** Enterprise container deployment
- **DigitalOcean Apps:** Simple cloud deployment

### Docker Deployment
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx playwright install chromium --with-deps
COPY . .
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## Monitoring

The worker logs all activities:
- ✅ Job processing status
- 🔍 Discovery results
- 💬 Comment posting attempts
- ❌ Errors and retries
- 📊 Performance metrics

Monitor the `campaign_logs` table in Supabase for detailed activity tracking.

## Production Considerations

1. **Proxy Rotation:** Use rotating proxies for IP diversity
2. **Rate Limiting:** Respect target site rate limits
3. **User Agents:** Rotate user agent strings
4. **CAPTCHA Handling:** Integrate CAPTCHA solving services or manual queues
5. **Error Handling:** Enhanced retry logic and dead letter queues
6. **Monitoring:** Application performance monitoring (APM)
7. **Scaling:** Horizontal scaling with multiple worker instances

## Legal and Ethical Considerations

- ⚖️ **Respect robots.txt** and site terms of service
- 🤖 **Don't bypass CAPTCHAs** - use manual review instead
- 📝 **Generate quality comments** that add value
- 🔄 **Rate limit requests** to avoid overwhelming sites
- 📋 **Maintain audit logs** for transparency
- 👥 **Human moderation** for quality control

## Troubleshooting

### Common Issues

1. **Playwright installation errors:**
   ```bash
   npx playwright install --with-deps chromium
   ```

2. **Permission errors in containers:**
   Add `--no-sandbox --disable-setuid-sandbox` to Chrome args

3. **Network timeouts:**
   Increase timeout values in Playwright configuration

4. **Form detection failures:**
   Update selectors for specific blog platforms

### Debug Mode
Set `DEBUG=true` in environment for verbose logging.

## Contributing

1. Test changes with demo campaigns first
2. Add comprehensive error handling
3. Update documentation for new features
4. Follow security best practices
5. Add tests for critical functionality
