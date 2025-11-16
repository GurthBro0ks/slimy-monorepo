# Slime Chat Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the fully functional Slime Chat feature to production.

## Prerequisites

- Node.js 18+ and pnpm installed
- OpenAI API key
- Production server or hosting platform
- Git repository access

## Environment Setup

### 1. Configure Environment Variables

Create a `.env.local` file (or configure in your hosting platform):

```bash
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1

# Optional: Existing environment variables
NEXT_PUBLIC_ADMIN_API_BASE=https://api.slimy.ai
NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=slimy.ai
```

**Important:** Never commit `.env.local` to version control. It's already in `.gitignore`.

### 2. Install Dependencies

```bash
cd slimyai-web
pnpm install
```

## Local Development

### 1. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### 2. Access Slime Chat

Navigate to `http://localhost:3000/chat`

### 3. Test Features

- **Personality Modes**: Click on different personality buttons (Helpful, Sarcastic, Professional, Creative, Technical)
- **Send Messages**: Type in the input field and press Enter or click the send button
- **Copy Messages**: Hover over messages to reveal the copy button
- **Clear Chat**: Click the "Clear Chat" button to reset the conversation
- **Persistence**: Refresh the page - your conversation should persist (stored in localStorage)

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: implement Slime Chat with personality modes"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `OPENAI_API_KEY`
     - `OPENAI_API_BASE`
   - Deploy

3. **Verify Deployment**:
   - Visit `https://your-domain.vercel.app/chat`
   - Test all features

### Option 2: Docker Deployment

1. **Build Docker Image**:
   ```bash
   docker build -t slimyai-web .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e OPENAI_API_KEY=your_key_here \
     -e OPENAI_API_BASE=https://api.openai.com/v1 \
     --name slimyai-web \
     slimyai-web
   ```

3. **Access Application**:
   - Visit `http://localhost:3000/chat`

### Option 3: Traditional Server

1. **Build Application**:
   ```bash
   pnpm build
   ```

2. **Start Production Server**:
   ```bash
   pnpm start
   ```

3. **Use Process Manager** (PM2):
   ```bash
   npm install -g pm2
   pm2 start npm --name "slimyai-web" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Reverse Proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name slimy.ai;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Post-Deployment Verification

### 1. Functional Tests

- [ ] Chat interface loads without errors
- [ ] Can send messages and receive AI responses
- [ ] All 5 personality modes work correctly
- [ ] Messages persist after page refresh
- [ ] Copy message functionality works
- [ ] Clear chat button works
- [ ] Rate limiting is active (10 messages per minute)
- [ ] Error handling displays properly
- [ ] Mobile responsive design works

### 2. Performance Tests

- [ ] Page load time < 3 seconds
- [ ] API response time < 2 seconds
- [ ] No console errors
- [ ] Proper error messages for API failures

### 3. Security Tests

- [ ] OpenAI API key is not exposed in client-side code
- [ ] Rate limiting prevents abuse
- [ ] No sensitive data in localStorage
- [ ] HTTPS enabled in production

## Monitoring and Maintenance

### 1. Monitor API Usage

Track OpenAI API usage in your OpenAI dashboard:
- Daily request count
- Token usage
- Cost tracking
- Error rates

### 2. Set Up Alerts

Configure alerts for:
- High API error rates (>5%)
- Unusual traffic patterns
- Rate limit violations
- API cost thresholds

### 3. Regular Maintenance

- **Weekly**: Review error logs
- **Monthly**: Analyze usage patterns and costs
- **Quarterly**: Update dependencies and security patches
- **As needed**: Adjust personality prompts based on feedback

## Troubleshooting

### Issue: "OpenAI API authentication failed"

**Cause**: Invalid or missing API key

**Solution**:
1. Verify `OPENAI_API_KEY` is set correctly
2. Check API key is active in OpenAI dashboard
3. Ensure no extra spaces or quotes in environment variable

### Issue: "Rate limit exceeded"

**Cause**: Too many requests in short time

**Solution**:
1. Wait 60 seconds before retrying
2. Consider implementing user-specific rate limiting
3. Increase rate limit in `app/api/chat/message/route.ts` if needed

### Issue: "Messages not persisting"

**Cause**: localStorage disabled or full

**Solution**:
1. Check browser localStorage is enabled
2. Clear old data if storage is full
3. Consider implementing server-side persistence

### Issue: "Slow response times"

**Cause**: OpenAI API latency or network issues

**Solution**:
1. Check OpenAI API status
2. Consider using GPT-3.5-turbo for faster responses
3. Implement response streaming for better UX
4. Add loading indicators

## Cost Optimization

### 1. Use Appropriate Models

```typescript
// For simple queries, use GPT-3.5-turbo
model: query.length < 100 ? 'gpt-3.5-turbo' : 'gpt-4'
```

### 2. Limit Conversation History

Current setting: Last 10 messages (already implemented)

### 3. Set Token Limits

Current setting: 1000 max tokens (already implemented)

### 4. Implement Caching

For frequently asked questions:

```typescript
// Example caching logic
const cacheKey = `chat:${hash(message)}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;
```

## Scaling Considerations

### For High Traffic

1. **Implement Redis for Rate Limiting**:
   - Replace in-memory rate limiting with Redis
   - Enables distributed rate limiting across multiple servers

2. **Add Database for Message Persistence**:
   - Store conversations in PostgreSQL
   - Enable user authentication
   - Provide conversation history across devices

3. **Implement Message Queue**:
   - Use Bull or RabbitMQ for async processing
   - Handle high request volumes gracefully

4. **Add CDN**:
   - Serve static assets via CDN
   - Reduce server load

## Security Best Practices

1. **API Key Management**:
   - Never commit API keys to version control
   - Rotate keys quarterly
   - Use environment-specific keys

2. **Rate Limiting**:
   - Implement per-user rate limiting
   - Add CAPTCHA for suspicious activity
   - Monitor for abuse patterns

3. **Content Filtering**:
   - Add input validation
   - Filter inappropriate content
   - Implement content moderation

4. **HTTPS Only**:
   - Enforce HTTPS in production
   - Use secure cookies
   - Enable HSTS headers

## Backup and Recovery

### 1. Database Backups (if implemented)

```bash
# Automated daily backups
pg_dump slimyai_db > backup_$(date +%Y%m%d).sql
```

### 2. Configuration Backups

- Backup environment variables
- Document configuration changes
- Version control all code changes

### 3. Disaster Recovery Plan

1. Keep recent backups offsite
2. Document recovery procedures
3. Test recovery process quarterly
4. Maintain fallback API keys

## Support and Resources

### Documentation
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Implementation Plan](./SLIME_CHAT_IMPLEMENTATION_PLAN.md)

### Getting Help
- Check error logs first
- Review OpenAI API status
- Consult implementation documentation
- Contact development team

## Changelog

### Version 1.0.0 (November 2025)
- ✅ Initial release of Slime Chat
- ✅ 5 personality modes (Helpful, Sarcastic, Professional, Creative, Technical)
- ✅ OpenAI GPT-4 integration
- ✅ Message persistence via localStorage
- ✅ Rate limiting (10 messages per minute)
- ✅ Copy message functionality
- ✅ Responsive design
- ✅ Error handling and loading states

### Planned Features (Version 2.0)
- [ ] Message streaming for real-time responses
- [ ] User authentication integration
- [ ] Database persistence for conversation history
- [ ] Voice input/output
- [ ] Image upload and analysis
- [ ] Conversation export (PDF, JSON)
- [ ] Custom personality modes
- [ ] Multi-language support

---

**Deployment Status**: ✅ Ready for Production

**Last Updated**: November 1, 2025

**Maintained By**: Slimy.ai Development Team
