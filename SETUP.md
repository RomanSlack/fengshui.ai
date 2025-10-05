# FengShui.fy - Setup Guide

## 🎯 Echo AI Monetization Integration

This app uses **Echo AI** for seamless payment integration and monetization!

### How It Works

1. **Free Trial**: Users get 3 free feng shui analyses without signing in
2. **Sign In**: After 3 free requests, users must sign in with Echo 
3. **Pay-Per-Use**: Users purchase credits ($5 = 50 analyses)
4. **Automatic Deduction**: Each analysis deducts 100 credits (= $0.10)
5. **Universal Balance**: Credits work across all Echo-powered apps!

### Echo Integration Flow

```
User Visit → 3 Free Analyses → Sign In Required → Add Credits → Unlimited Usage
```

## 🚀 Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file with your Google API key:
```bash
echo "GOOGLE_API_KEY=your_google_api_key_here" > .env
```

4. Start the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

Backend will run at: http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Environment variables are already configured in `.env.local`:
```
NEXT_PUBLIC_ECHO_APP_ID=b52174f1-ce71-44e2-bf4e-e5e998db28d8
```

4. Start the Next.js development server:
```bash
npm run dev
```

Frontend will run at: http://localhost:3000

## 📱 Using the App

1. Visit http://localhost:3000/upload
2. Upload a room photo
3. Click "Analyze Feng Shui"
4. Get your feng shui score and recommendations!

### Monetization Flow

**First 3 Requests (Free Trial):**
- No sign-in required
- Counter shows remaining free analyses
- Data stored in browser localStorage

**After 3 Requests:**
- "Sign In with Echo" button appears
- OAuth authentication via Echo
- Universal balance shared across Echo apps

**Adding Credits:**
- Click "Add Credits" button
- Redirected to Echo payment page
- $5 = 5000 credits = 50 analyses (each analysis = 100 credits = $0.10)
- Return to app automatically after payment

## 🔧 Technical Details

### Architecture

```
Frontend (Next.js) → Backend (FastAPI) → Gemini AI
         ↓
    Echo SDK (Auth + Payments)
```

### Echo SDK Components Used

- `EchoProvider`: Wraps entire app with auth context
- `useEcho()`: Handles authentication state
- `useEchoClient()`: Manages balance and payments
- `EchoAuth`: Custom component for sign in/out

### Pricing Configuration

Located in: `frontend/app/upload/page.tsx`

```typescript
const FREE_REQUESTS = 3;  // Free tier
// Each analysis costs 100 credits
// $5 purchase = 5000 credits = 50 analyses
```

Adjust pricing by changing:
- `amount: 100` in `echoClient.balance.deduct()`
- Button text in "Add Credits" button

## 🎨 Customization

### Change Pricing

Edit `frontend/app/upload/page.tsx`:

```typescript
// For $0.05 per analysis
await echoClient.balance.deduct({ amount: 50 });

// For $0.25 per analysis
await echoClient.balance.deduct({ amount: 250 });
```

### Change Free Trial Limit

```typescript
const FREE_REQUESTS = 5;  // Give 5 free analyses instead of 3
```

### Change Credit Package

```typescript
const paymentLink = await echoClient.balance.createPaymentLink({
  amount: 10000,  // $10 for 100 analyses
  returnUrl: window.location.href
});
```

## 📊 Monetization Metrics

Track these for the hackathon demo:

- Total users
- Free trial completion rate
- Sign-up conversion rate (after 3 free)
- Payment conversion rate
- Average revenue per user (ARPU)
- Analyses per paying user

## 🐛 Troubleshooting

**Echo authentication not working?**
- Check NEXT_PUBLIC_ECHO_APP_ID in .env.local
- Verify app ID at https://echo.merit.systems/dashboard

**Balance not updating?**
- Refresh page after payment
- Check browser console for errors
- Verify echoClient.balance.deduct() is called

**Backend not connecting?**
- Ensure backend runs on port 8000
- Check CORS settings in backend/main.py
- Verify GOOGLE_API_KEY is set

## 📚 Resources

- Echo Docs: https://echo.merit.systems/docs
- FastAPI Docs: https://fastapi.tiangolo.com
- Next.js Docs: https://nextjs.org/docs
- Google Gemini: https://ai.google.dev
