# Stripe Payment Setup Guide for HollaClean

Complete guide to integrating Stripe payments for collecting payments from customers and paying out cleaners.

## Table of Contents
1. [Overview](#overview)
2. [Stripe Account Setup](#stripe-account-setup)
3. [Understanding Payment Flow](#understanding-payment-flow)
4. [API Integration](#api-integration)
5. [Testing Payments](#testing-payments)
6. [Going Live](#going-live)
7. [Handling Payouts](#handling-payouts)

---

## Overview

### How HollaClean Payments Work

```
Customer Books Service ($100)
         ↓
Stripe Processes Payment
         ↓
HollaClean Receives $100
         ↓
Automatic Split:
- Platform Commission: $20 (20%)
- Stripe Fee: ~$3.20 (2.9% + $0.30)
- Cleaner Payout: $80
         ↓
Cleaner Receives $80 in their bank account
```

### Ontario Tax Considerations

**HST (13% in Ontario):**
- You must collect HST on your service fee (20% commission)
- Register for HST when revenue exceeds $30,000/year
- HST registration: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register.html

**Example with HST:**
- Service: $100
- Commission: $20
- HST on commission: $2.60
- Customer pays: $102.60
- You remit $2.60 to CRA
- You keep: $20

---

## Stripe Account Setup

### Step 1: Create Account

1. **Go to Stripe**
   - Visit: https://dashboard.stripe.com/register
   
2. **Enter Information**
   - Email: your business email
   - Password: strong password
   - Country: Canada

3. **Verify Email**
   - Check inbox
   - Click verification link

### Step 2: Business Information

4. **Business Details**
   - Business name: HollaClean (or your legal name)
   - Business type:
     - Sole proprietorship (if just you)
     - Corporation (if incorporated)
   - Industry: "Professional Services"
   - Website: hollaclean.com

5. **Business Address**
   - Your address in Ontario
   - Must match your ID

6. **Verify Phone Number**
   - Enter phone
   - Receive SMS code
   - Enter code

### Step 3: Identity Verification

7. **Upload ID**
   - Driver's license, or
   - Passport, or
   - Other government ID
   
8. **Additional Information** (if requested)
   - Last 4 digits of SIN (for sole proprietor)
   - Business number (if incorporated)
   - Bank account details

9. **Wait for Approval**
   - Usually 1-2 business days
   - Check email for updates
   - May request additional documents

---

## Understanding Payment Flow

### Standard Payment Flow

```javascript
// 1. Customer selects cleaner and creates booking
const booking = {
  cleanerId: "cleaner_123",
  hours: 3,
  hourlyRate: 30,
  total: 90
};

// 2. Calculate split
const commission = 90 * 0.20;        // $18 (20%)
const stripeFee = 90 * 0.029 + 0.30; // $2.91
const cleanerPayout = 90 - commission; // $72
const platformProfit = commission - stripeFee; // $15.09

// 3. Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 9000, // Amount in cents ($90.00)
  currency: 'cad',
  metadata: {
    bookingId: booking.id,
    cleanerId: booking.cleanerId
  }
});

// 4. Customer completes payment
// 5. Webhook confirms payment
// 6. Create payout to cleaner for $72
```

### Payment States

| State | Description | Action |
|-------|-------------|--------|
| `pending` | Booking created | Show "Pay Now" button |
| `processing` | Payment initiated | Show loading |
| `succeeded` | Payment complete | Show confirmation |
| `failed` | Payment failed | Show error, retry |
| `refunded` | Booking cancelled | Money returned |

---

## API Integration

### Get Your API Keys

1. **Test Mode Keys** (for development)
   - Dashboard: https://dashboard.stripe.com/test/apikeys
   - Publishable key: `pk_test_...`
   - Secret key: `sk_test_...`

2. **Live Mode Keys** (for production)
   - Toggle to "Live" in dashboard
   - Dashboard: https://dashboard.stripe.com/apikeys
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

### Add Keys to Your App

**In Vercel:**
```
Environment Variables:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
```

### Basic Payment Integration

```javascript
// Install Stripe
npm install @stripe/stripe-js

// In your React component
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Create payment
const handlePayment = async (bookingAmount) => {
  const stripe = await stripePromise;
  
  // Call your backend to create payment intent
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: bookingAmount * 100, // Convert to cents
      currency: 'cad'
    })
  });
  
  const { clientSecret } = await response.json();
  
  // Confirm payment
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: customerName,
        email: customerEmail
      }
    }
  });
  
  if (result.error) {
    // Payment failed
    console.error(result.error.message);
  } else {
    // Payment succeeded
    console.log('Payment successful!');
  }
};
```

---

## Testing Payments

### Test Card Numbers

**Successful Payments:**
- `4242 4242 4242 4242` - Visa
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - American Express

**Use with:**
- Any future expiry date (e.g., 12/25)
- Any 3-digit CVC (e.g., 123)
- Any postal code (e.g., M5H 2N2)

**Failed Payments (for testing):**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

### Test Scenarios

1. **Successful Booking**
   - Create booking: $90 for 3 hours
   - Use test card: 4242...
   - Complete payment
   - Check Stripe dashboard for transaction
   - Verify amounts are correct

2. **Failed Payment**
   - Use decline card: 4000...0002
   - Verify error message shows
   - User can retry

3. **Refund**
   - Go to Stripe dashboard
   - Find payment
   - Click "Refund"
   - Full or partial refund

### View Test Transactions

1. **In Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/test/payments
   - See all test payments
   - Click for details

2. **Check Details**
   - Amount
   - Status
   - Fees
   - Metadata (booking ID, etc.)

---

## Going Live

### Pre-Launch Checklist

- [ ] Stripe account fully verified
- [ ] Business information complete
- [ ] Bank account linked
- [ ] Payout schedule set
- [ ] Test payments working
- [ ] Live API keys added to Vercel
- [ ] Terms of service updated
- [ ] Privacy policy published

### Switch to Live Mode

1. **Get Live Keys**
   - Toggle "Test mode" OFF in Stripe
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy live keys

2. **Update Environment Variables**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
   ```

3. **Redeploy App**
   - Vercel will redeploy automatically
   - Or trigger manual deploy

4. **Test with Real Card**
   - Use your own card
   - Make small test purchase ($1-2)
   - Verify everything works
   - Refund the test

### Monitor Live Payments

1. **Dashboard:** https://dashboard.stripe.com/payments
2. **Email notifications:** Enabled by default
3. **Set up alerts** for:
   - Failed payments
   - Disputes/chargebacks
   - Large transactions

---

## Handling Payouts

### Stripe Connect for Cleaners

**Two Options:**

#### Option 1: Standard Accounts (Recommended)
- Cleaners create their own Stripe accounts
- You send them money via Transfer
- They manage their own taxes
- Best for independent contractors

**Setup:**
```javascript
// Cleaner clicks "Connect Stripe"
const accountLink = await stripe.accountLinks.create({
  account: cleanerStripeAccountId,
  refresh_url: 'https://hollaclean.com/connect/refresh',
  return_url: 'https://hollaclean.com/connect/success',
  type: 'account_onboarding',
});

// Redirect cleaner to accountLink.url
window.location.href = accountLink.url;
```

#### Option 2: Express Accounts
- Simplified onboarding
- Less control for cleaner
- You handle more compliance

### Payout Schedule

**Set in Stripe Dashboard:**
1. Go to Connect → Settings
2. Choose payout schedule:
   - **Daily**: Payouts every day (recommended)
   - **Weekly**: Every Monday
   - **Monthly**: 1st of month
   - **Manual**: You control when

**Timing:**
- Funds available 2 business days after payment
- Then sent according to schedule
- Example: Customer pays Monday → Cleaner receives Wednesday (if daily)

### Canadian Banking

**Requirements:**
- Canadian bank account
- Transit number (5 digits)
- Institution number (3 digits)
- Account number

**Major Banks Supported:**
- TD, RBC, Scotiabank, BMO, CIBC
- Most credit unions
- Online banks (Tangerine, Simplii, etc.)

---

## Fees Breakdown

### Your Costs (as Platform)

**Per Transaction:**
- Stripe fee: 2.9% + $0.30 CAD
- Your commission: 20% of transaction

**Example on $100 booking:**
- Gross: $100
- Stripe fee: $3.20
- Your commission: $20
- Cleaner receives: $80
- Your profit: $16.80

### Cleaner's Perspective

**On $100 job:**
- Customer pays: $100
- Platform takes: $20 (20%)
- Cleaner receives: $80
- No additional fees to cleaner

---

## Handling Disputes & Refunds

### Refunds

**Full Refund:**
```javascript
const refund = await stripe.refunds.create({
  payment_intent: 'pi_...',
  reason: 'requested_by_customer'
});
```

**Partial Refund:**
```javascript
const refund = await stripe.refunds.create({
  payment_intent: 'pi_...',
  amount: 5000, // $50.00 in cents
  reason: 'requested_by_customer'
});
```

**Refund Timeline:**
- Requested in Stripe dashboard
- Processed immediately
- Customer receives funds in 5-10 business days

### Disputes (Chargebacks)

**If customer disputes charge:**
1. Stripe notifies you via email
2. You have 7 days to respond
3. Provide evidence:
   - Booking confirmation
   - Communication with customer
   - Photos of completed work
   - Customer signature (if obtained)

**Best Practices:**
- Respond quickly (within 24 hours)
- Provide detailed evidence
- Keep good records
- Have clear cancellation policy

---

## Tax Reporting

### For Your Business

**Stripe provides:**
- Annual 1099-K (if applicable)
- Transaction history CSV export
- Revenue reports

**Your Responsibilities:**
- Track income and expenses
- Register for HST when over $30k
- File quarterly HST returns
- Keep records for 6 years

### For Cleaners

**You must issue T4A slips:**
- If paying contractor >$500/year
- Due by end of February
- Report to CRA
- Give copy to cleaner

**Tools:**
- Use accounting software (QuickBooks, Wave)
- Or hire bookkeeper
- Cost: ~$100-200/month

---

## Security Best Practices

### Protect Your Keys

- ✅ Never commit secret keys to GitHub
- ✅ Use environment variables
- ✅ Rotate keys if compromised
- ✅ Use different keys for test/live

### PCI Compliance

**Good news:** Stripe handles PCI compliance
- Never store card numbers yourself
- Use Stripe Elements for card input
- Stripe tokenizes cards securely

### Fraud Prevention

**Stripe Radar** (included free):
- Machine learning fraud detection
- Blocks suspicious payments
- 3D Secure for high-risk
- Customizable rules

**Enable in Dashboard:**
- Radar → Rules
- Set risk thresholds
- Review flagged payments

---

## Support & Resources

### Stripe Documentation
- Docs: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Canada-specific: https://stripe.com/en-ca

### Stripe Support
- Email: support@stripe.com
- Response time: 24-48 hours
- Phone: Available for some accounts

### Community
- Stack Overflow: [stripe] tag
- Stripe Discord
- GitHub discussions

---

## Quick Reference

### Important Links
- Dashboard: https://dashboard.stripe.com
- Test Dashboard: https://dashboard.stripe.com/test
- API Keys: https://dashboard.stripe.com/apikeys
- Webhooks: https://dashboard.stripe.com/webhooks
- Connect: https://dashboard.stripe.com/connect

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient: 4000 0000 0000 9995
```

### Fee Calculator
```
Transaction: $X
Stripe: $X * 0.029 + 0.30
Commission: $X * 0.20
Cleaner: $X * 0.80
Platform: ($X * 0.20) - (Stripe fee)
```

---

## Troubleshooting

### Common Issues

**"Invalid API Key"**
- Check key is correct
- Verify test vs live mode
- Ensure no extra spaces

**"Payment Failed"**
- Check card details
- Verify sufficient funds
- Check if card supports international
- Try different card

**"Payout Failed"**
- Verify bank details
- Check account is verified
- Ensure sufficient balance
- Contact Stripe support

**"Webhook Not Firing"**
- Check endpoint URL
- Verify webhook signature
- Check firewall settings
- Test with Stripe CLI

---

## Need Help?

If you run into issues:
1. Check Stripe dashboard for error messages
2. Review Stripe logs
3. Test in test mode first
4. Contact Stripe support
5. Check their detailed documentation

**You've got this! 💪**
