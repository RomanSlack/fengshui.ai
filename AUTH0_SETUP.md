# Auth0 Setup Guide - Feng Shui AI

## 🔐 Auth0 Integration with Google Sign-In

Your Feng Shui AI app now has Auth0 authentication with Google OAuth!

## 📋 Your Auth0 Credentials

**Client ID**: `ISDSR4eqmCeTQxkGEhuLHnTEdkjdmJRY`
**Application Type**: Regular Web Applications

## 🚀 Setup Steps

### 1. Complete Auth0 Dashboard Configuration

Go to your Auth0 Dashboard and configure:

#### A. Allowed Callback URLs
Add these to your application settings:
```
http://localhost:3000
http://localhost:3000/upload
https://your-production-domain.com
https://your-production-domain.com/upload
```

#### B. Allowed Logout URLs
```
http://localhost:3000
https://your-production-domain.com
```

#### C. Allowed Web Origins
```
http://localhost:3000
https://your-production-domain.com
```

### 2. Enable Google Social Connection

1. Go to **Authentication** → **Social** in Auth0 Dashboard
2. Click **Google**
3. Enable the connection
4. Add your Google OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)
5. Select the Auth0 application you want to use (your Regular Web App)
6. Save changes

### 3. Get Your Auth0 Domain

Find your Auth0 domain in the dashboard (looks like: `dev-xxx.us.auth0.com`)

Update your `.env.local`:

```bash
# Auth0 Configuration
NEXT_PUBLIC_AUTH0_DOMAIN=your-domain.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=ISDSR4eqmCeTQxkGEhuLHnTEdkjdmJRY
```

### 4. Google Cloud Console Setup

If you haven't set up Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set **Application Type**: Web application
6. Add **Authorized redirect URIs**:
   ```
   https://your-domain.us.auth0.com/login/callback
   ```
7. Copy Client ID and Secret to Auth0

## 🎯 How It Works

### Authentication Flow

1. **User visits app** → Sees "Sign in with Google" button
2. **Clicks button** → Redirected to Auth0
3. **Auth0 shows Google login** → User authenticates with Google
4. **Success** → User redirected back to app
5. **Authenticated** → Can use all features

### Integration with Your App

```
Free Trial (3 analyses)
        ↓
Sign in with Google (Auth0)
        ↓
Unlimited analyses for Auth0 users
        ↓
Optional: Echo payment for credits
```

## 💡 Features

✅ **Google Sign-In**: One-click authentication
✅ **Profile Display**: Shows user's Google profile picture and name
✅ **Secure Logout**: Proper session management
✅ **Free Trial**: 3 analyses before sign-in required
✅ **Auth0 Users**: Unlimited analyses once signed in
✅ **Echo Integration**: Optional payment system on top

## 🔧 Technical Implementation

### Files Modified

- ✅ [frontend/app/providers.tsx](frontend/app/providers.tsx) - Added Auth0Provider
- ✅ [frontend/components/Auth0Button.tsx](frontend/components/Auth0Button.tsx) - Google sign-in button
- ✅ [frontend/app/upload/page.tsx](frontend/app/upload/page.tsx) - Auth0 integration
- ✅ [frontend/.env.local](frontend/.env.local) - Auth0 credentials

### Authentication Hooks

```typescript
import { useAuth0 } from '@auth0/auth0-react';

const {
  isAuthenticated,
  user,
  loginWithRedirect,
  logout
} = useAuth0();
```

### Sign In with Google

```typescript
loginWithRedirect({
  authorizationParams: {
    connection: 'google-oauth2',
  }
})
```

## 🎨 UI Components

### Auth0Button Component

The custom Auth0 button includes:
- Google logo
- Loading state
- User profile display (with Google profile picture)
- Sign out functionality

### Status Display

Shows different messages based on auth state:
- **Not signed in**: "3 free analyses remaining"
- **Auth0 user**: "Unlimited analyses"
- **Echo + Auth0**: Shows credit balance

## 🧪 Testing

### Test the Flow

1. Start the app:
```bash
cd frontend
npm run dev
```

2. Visit http://localhost:3000/upload

3. Try uploading 3 images (free trial)

4. On 4th attempt, see "Sign in with Google"

5. Click sign in → redirected to Auth0

6. Select Google account

7. Redirected back → now authenticated!

8. Upload unlimited images

### Check Authentication

Open browser console:
```javascript
// Should show user object
console.log(user)

// Should be true after sign-in
console.log(isAuthenticated)
```

## 🏆 Hackathon Benefits

### Why This Wins

1. **Two Sponsor Prizes**:
   - Auth0 (social sign-in, MFA ready)
   - Echo (monetization integration)

2. **Professional Auth**: Industry-standard OAuth2
3. **Easy UX**: One-click Google sign-in
4. **Scalable**: Auth0 handles all auth complexity
5. **Feature-Rich**: Ready for MFA, passwordless, etc.

### Demo Script

1. Show free trial (3 analyses)
2. Demo Google sign-in flow
3. Highlight Auth0 dashboard
4. Show unlimited access for signed-in users
5. Optional: Demo Echo payment integration

## 🐛 Troubleshooting

**"Callback URL mismatch"**
- Add your URL to Auth0 Allowed Callback URLs

**"Google connection not found"**
- Enable Google social connection in Auth0 dashboard
- Link it to your application

**"Invalid domain"**
- Check NEXT_PUBLIC_AUTH0_DOMAIN in .env.local
- Should be like: `dev-xxx.us.auth0.com` (no https://)

**User not appearing after sign-in**
- Check browser console for errors
- Verify Auth0Provider is wrapping your app
- Clear browser cookies and try again

## 📚 Resources

- Auth0 Docs: https://auth0.com/docs
- Auth0 React SDK: https://auth0.com/docs/quickstart/spa/react
- Google OAuth: https://developers.google.com/identity/protocols/oauth2

## 🎉 You're Ready!

Your app now has:
- ✅ Professional authentication
- ✅ Google OAuth sign-in
- ✅ User profile management
- ✅ Freemium model (3 free → sign in)
- ✅ Optional payment integration (Echo)

Perfect for winning both Auth0 AND Echo sponsor prizes! 🏆🏆
