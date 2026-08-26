# AppSail Deployment Guide

## Overview
This Next.js application is configured for deployment to Zoho Catalyst AppSail as a Node.js managed runtime.

## Configuration Files

### 1. `app-config.json`
AppSail configuration with runtime, memory, and startup settings:
```json
{
  "command": "node server.js",
  "buildPath": ".",
  "stack": "node22",
  "memory": 2048,
  "port": 3000
}
```

### 2. `server.js`
Custom server entry point that:
- Uses Catalyst's `X_ZOHO_CATALYST_LISTEN_PORT` environment variable
- Initializes Next.js in standalone mode
- Handles requests properly for AppSail environment

### 3. `next.config.ts`
Configured with:
- `output: 'standalone'` for AppSail compatibility
- Optimized package imports for bundle size
- Compression and security headers

## Deployment Methods

### Method 1: Deploy via Catalyst CLI

#### Prerequisites
1. Install Catalyst CLI:
   ```bash
   npm install -g zcatalyst-cli
   ```

2. Login to Catalyst:
   ```bash
   catalyst login
   ```

#### Deploy Steps
1. Navigate to project directory:
   ```bash
   cd crimeintel
   ```

2. Initialize AppSail (first time only):
   ```bash
   catalyst init
   catalyst appsail:add
   ```

3. Deploy the application:
   ```bash
   catalyst deploy
   ```

The CLI will:
- Run `npm run build` (predeploy script)
- Upload build files
- Start the server with `node server.js`
- Provide the AppSail URL

### Method 2: Deploy from Console

1. Go to [Catalyst Console](https://console.catalyst.zoho.com)
2. Select your project
3. Navigate to **AppSail** → **Add Service**
4. Choose **Catalyst Managed Runtime**
5. Select **Node.js 22**
6. Upload your project files (or connect GitHub repo)
7. Set configurations:
   - **Memory**: 2048 MB
   - **Startup Command**: `node server.js`
   - **Build Path**: `.` (root directory)
8. Click **Deploy**

### Method 3: GitHub Integration

1. Push code to GitHub
2. In Catalyst Console → **AppSail**
3. Choose **Deploy from Git Repository**
4. Connect your GitHub repo
5. Select branch (main)
6. Catalyst will auto-detect configuration from `app-config.json`
7. Click **Deploy**

## Environment Variables

Set these in Catalyst Console → AppSail → Service → **Settings** → **Environment Variables**:

Required:
- `NODE_ENV`: `production`
- `CATALYST_PROJECT_ID`: (from Catalyst Console)
- `CATALYST_PROJECT_KEY`: (from Catalyst Console)
- `CATALYST_PROJECT_DOMAIN`: (from Catalyst Console)

Optional (for external integrations):
- `GOOGLE_MAPS_API_KEY`: (if using maps)
- Any other API keys

## Build Process

When deployed, AppSail will:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Predeploy Script**:
   ```bash
   npm run build
   ```
   This creates:
   - `.next/standalone/` - Optimized production server
   - `.next/static/` - Static assets
   - `public/` - Public files

3. **Start Server**:
   ```bash
   node server.js
   ```

## Port Configuration

The application automatically detects the port:
```javascript
const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 
             process.env.PORT || 
             3000;
```

Catalyst sets `X_ZOHO_CATALYST_LISTEN_PORT` automatically.

## Memory Recommendations

- **Development/Testing**: 512 MB - 1024 MB
- **Production**: 2048 MB (recommended for this app)
- **High Traffic**: 4096 MB

Adjust in `app-config.json` or Console Settings.

## Monitoring & Logs

After deployment:

1. **View Logs**:
   ```bash
   catalyst logs:appsail
   ```

2. **Monitor Performance**:
   - Catalyst Console → AppSail → Service → **Metrics**
   - Check CPU, Memory, Request rates

3. **Health Check**:
   - Visit: `https://your-app.catalyst.zoho.com/`
   - Should see the login page

## Troubleshooting

### Build Fails
- Check Node.js version matches (22.x)
- Verify all dependencies in `package.json`
- Review build logs in Console

### Server Won't Start
- Verify `server.js` has execute permissions
- Check startup command in `app-config.json`
- Review environment variables

### Port Binding Issues
- Ensure using `X_ZOHO_CATALYST_LISTEN_PORT`
- Check `server.js` port configuration
- Don't hardcode port numbers

### Memory Issues
- Increase memory allocation in `app-config.json`
- Optimize bundle size with tree-shaking
- Check for memory leaks in logs

## Updating the Deployment

### Via CLI:
```bash
cd crimeintel
catalyst deploy
```

### Via Console:
1. Go to AppSail → Your Service
2. Click **Redeploy** or **Update**
3. Upload new files if needed
4. Save changes

## Rollback

If deployment fails:
```bash
catalyst rollback:appsail
```

Or in Console:
- AppSail → Service → **Versions**
- Select previous version → **Rollback**

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Memory allocation optimized
- [ ] Build succeeds locally
- [ ] Database connections tested
- [ ] API keys secured
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Performance tested with expected load

## Support

- **Catalyst Documentation**: https://docs.catalyst.zoho.com/
- **CLI Help**: `catalyst help appsail`
- **Support**: support@zohocatalyst.com

## Next Steps

1. Deploy using your preferred method above
2. Configure custom domain (optional)
3. Set up SSL certificate (automatic with Catalyst)
4. Configure CDN caching for static assets
5. Set up monitoring and alerts

---

**Deployment Status**: Ready for AppSail deployment
**Last Updated**: January 2025
