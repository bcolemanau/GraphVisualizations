# Environment Variable Setup

## Required Environment Variables for Production

### Railway Deployment

When deploying to Railway, configure these environment variables in your Railway dashboard:

#### Essential Variables

```bash
# Base URL - Set to your Railway deployment URL
BASE_URL=https://your-graphviz-app.railway.app

# API Keys - Comma-separated list for service authentication
API_KEYS=your-backend-key,your-librechat-key

# Allowed Origins - Comma-separated list of allowed CORS origins
ALLOWED_ORIGINS=https://your-librechat.railway.app,https://your-backend.railway.app

# Node Environment
NODE_ENV=production
```

#### Optional Variables

```bash
# Port (Railway provides this automatically)
PORT=3000
```

## Local Development

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your local settings:

```bash
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
API_KEYS=  # Leave empty for no auth in development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

## Integration with Backend Agents

Your backend agents should include the GraphVisualizations API key in requests:

```javascript
const response = await fetch('https://your-graphviz-app.railway.app/api/graph', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.GRAPHVIZ_API_KEY  // Add to backend env
  },
  body: JSON.stringify({ graph: graphData })
});
```

## Integration with LibreChat

LibreChat should also include the API key when fetching graph data:

```javascript
const response = await fetch(`https://your-graphviz-app.railway.app/api/graph/${graphId}`, {
  headers: {
    'X-API-Key': process.env.GRAPHVIZ_API_KEY  // Add to LibreChat env
  }
});
```

## Security Notes

- **Never commit `.env` files** - they are in `.gitignore`
- **Use strong, random API keys** - generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Restrict CORS origins** - only allow your specific domains in production
- **Use HTTPS** - Railway provides this automatically
