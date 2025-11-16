# Deployment Guide

## Quick Start

The website is now ready for deployment! Here's what you need to know:

## Repository

- **GitHub:** https://github.com/GurthBro0ks/slimyai-web
- **Status:** ✅ Build passing

## Environment Variables

Set these in your deployment platform:

```bash
NEXT_PUBLIC_ADMIN_API_BASE="https://your-admin-api.com"
NEXT_PUBLIC_SNELP_CODES_URL="https://snelp.com/api/codes"
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="slimy.ai"
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Import the repository in Vercel
2. Add environment variables
3. Deploy

```bash
vercel --prod
```

### Option 2: Docker

```bash
# Build
docker build -t slimyai-web \
  --build-arg NEXT_PUBLIC_ADMIN_API_BASE="https://your-api.com" \
  .

# Run
docker run -p 3000:3000 slimyai-web
```

### Option 3: Node.js Server

```bash
# Build
pnpm install
pnpm build

# Start
pnpm start
```

## GitHub Actions (Workflows)

**Note:** The GitHub Actions workflows are in `.github/workflows/` but couldn't be pushed due to permission restrictions. You'll need to add them manually through the GitHub web interface:

1. Go to your repository on GitHub
2. Create `.github/workflows/ci.yml` and `.github/workflows/docs-sync.yml`
3. Copy the content from the local files

## Post-Deployment

1. **Test the deployment:**
   - Visit the homepage
   - Check `/snail/codes` for codes aggregator
   - Verify `/docs` renders correctly
   - Test `/status` page

2. **Configure Admin API:**
   - Update `NEXT_PUBLIC_ADMIN_API_BASE` with your actual API URL
   - Test authentication flow
   - Verify role mapping works

3. **Set up docs sync:**
   - Configure `DOCS_SOURCE_REPO` if using external docs
   - Test docs import: `pnpm docs:import`

## Features Ready

✅ Homepage with hero and features  
✅ Codes aggregator (Snelp + Reddit)  
✅ MDX docs system with 3 sample docs  
✅ Status page  
✅ API proxies (ready for Admin API)  
✅ Role-based routing  
✅ Docker support  
✅ Testing infrastructure  

## Next Steps

1. **Connect Admin API** - Update environment variable with real API URL
2. **Add real docs** - Run `pnpm docs:import` with your docs repo
3. **Customize branding** - Update colors, logos, and content
4. **Enable analytics** - Configure Plausible or add your preferred analytics

## Support

- **Documentation:** See README.md
- **Issues:** https://github.com/GurthBro0ks/slimyai-web/issues
