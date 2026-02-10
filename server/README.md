# HollaClean Payment Server

Backend server for handling Stripe payments in the HollaClean cleaning marketplace.

## Features

- **Payment Collection**: Collect payments from homeowners using Stripe Payment Intents
- **Stripe Connect**: Cleaner onboarding for receiving payouts
- **Platform Fees**: Automatic 20% platform fee collection
- **Admin Dashboard**: View platform earnings and transaction history

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Set Up Stripe

1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

4. Add your Stripe keys to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
PORT=3001
FRONTEND_URL=http://localhost:5173
PLATFORM_FEE_PERCENT=20
```

### 3. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### Payments (Homeowners)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/create-intent` | POST | Create payment intent for a job |
| `/api/payments/:id` | GET | Get payment status |

### Stripe Connect (Cleaners)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connect/create-account` | POST | Create Stripe Connect account |
| `/api/connect/onboarding-link` | POST | Get onboarding URL |
| `/api/connect/status/:cleanerId` | GET | Check account status |
| `/api/connect/dashboard-link` | POST | Get Stripe dashboard URL |
| `/api/connect/balance/:cleanerId` | GET | Get cleaner's balance |

### Admin

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/earnings` | GET | Get platform earnings summary |
| `/api/admin/balance` | GET | Get platform Stripe balance |

### Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/stripe` | POST | Handle Stripe webhook events |

## Payment Flow

### For Homeowners (Paying for Services)

```
1. Homeowner books a cleaning
2. Frontend calls POST /api/payments/create-intent
3. Server creates Stripe Payment Intent
4. Frontend shows payment form (Stripe Elements)
5. Homeowner submits card details
6. Payment is processed
7. Webhook confirms payment success
8. Job marked as paid
```

### For Cleaners (Receiving Payouts)

```
1. Cleaner goes to Profile > Stripe Payouts
2. Clicks "Set Up Payment Account"
3. Redirected to Stripe Express onboarding
4. Completes verification (ID, bank details)
5. Returns to app with active account
6. Receives 80% of each completed job automatically
7. Can view earnings in Stripe Dashboard
```

### For Admin (Platform Earnings)

```
1. Access Admin Dashboard > Stripe Finance tab
2. View available balance (ready for payout)
3. View pending balance (processing)
4. Click "Stripe Dashboard" to manage payouts
5. Transfer earnings to your bank account
```

## Webhook Setup (Production)

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
4. Copy the webhook signing secret to your `.env`

## Test Cards

For testing in development mode:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Declined card |
| `4000 0000 0000 0341` | Declined (incorrect CVC) |

Use any future expiry date and any 3-digit CVC.

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Set up webhook endpoint with live URL
- [ ] Enable production mode in Stripe Dashboard
- [ ] Add proper database (replace in-memory storage)
- [ ] Add authentication for admin endpoints
- [ ] Set up HTTPS
- [ ] Add rate limiting
- [ ] Add request logging

## Architecture

```
server/
├── index.js          # Main server file with all routes
├── package.json      # Dependencies
├── .env.example      # Environment variables template
└── README.md         # This file
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `PLATFORM_FEE_PERCENT` | Platform fee percentage | `20` |

## Support

For issues with Stripe integration, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)
