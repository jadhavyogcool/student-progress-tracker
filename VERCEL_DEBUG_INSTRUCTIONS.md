# Vercel Deployment Debug Instructions

## Environment Variables Required

Add these to your Vercel dashboard → Project Settings → Environment Variables:

### Backend Variables (Environment: Production)
```
NODE_ENV=production
SESSION_SECRET=your_random_secure_string_32_chars_long
ADMIN_PASSWORD=your_secure_admin_password
FRONTEND_URL=https://your-frontend-domain.vercel.app
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
GITHUB_TOKEN=your_github_personal_access_token
```

### Frontend Variables (Environment: Production)
```
VITE_API_URL=your-backend-domain.vercel.app
```

## Debug Steps

1. **Deploy the code** with the new debug endpoints
2. **Test authentication flow**:
   - Visit `https://your-backend.vercel.app/api/debug` to check environment
   - Login through the frontend
   - Check browser console and Vercel logs
3. **Common Issues**:
   - Missing `SESSION_SECRET` causes session to not persist
   - Wrong `FRONTEND_URL` causes CORS issues
   - `NODE_ENV` not set to "production" breaks cookie settings

## Debug Endpoints

After deployment, test these endpoints:
- `GET /api/debug` - Shows environment and session info
- `GET /api/auth/verify` - Checks current authentication status

## Expected Behavior

1. Login should create a session
2. Session should persist between requests
3. Delete operations should work for authenticated users
4. Browser console should show session logs

## If Issues Persist

If session authentication still doesn't work, the fallback solution is to implement JWT token authentication instead of sessions, which is more reliable for serverless environments.

## Remove Debug Logs

After fixing the issue, remove console.log statements from:
- `middleware/auth.js`
- `routes.js` (login, verify, delete endpoints)
- Remove `api/debug.js` and `vercel.json` debug route