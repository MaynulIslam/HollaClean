# HollaClean Deployment Guide

Complete step-by-step guide to deploy HollaClean to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Domain Setup](#domain-setup)
3. [Vercel Deployment](#vercel-deployment)
4. [Stripe Setup](#stripe-setup)
5. [Final Configuration](#final-configuration)
6. [Testing](#testing)
7. [Going Live](#going-live)

---

## Prerequisites

Before you start, make sure you have:
- [ ] Credit card for domain purchase ($12/year)
- [ ] Email address
- [ ] Phone number (for Stripe verification)
- [ ] Computer with internet access

**Total Time:** 1-2 hours
**Total Cost:** $12 (domain only)

---

## Step 1: Domain Setup (15 minutes)

### Buy Your Domain

1. **Go to Namecheap.com**
   - Visit: https://www.namecheap.com

2. **Search for hollaclean.com**
   - Enter "hollaclean.com" in search
   - If taken, try: hollaclean.ca, gethollaclean.com, etc.

3. **Purchase Domain**
   - Add to cart
   - Proceed to checkout
   - Cost: ~$12-15/year
   - Complete purchase

4. **Access Domain Dashboard**
   - Go to: https://ap.www.namecheap.com/domains/list/
   - Click "Manage" next to your domain

5. **Keep this tab open** - You'll need it later

---

## Step 2: Vercel Deployment (30 minutes)

### Create Vercel Account

1. **Visit Vercel**
   - Go to: https://vercel.com/signup
   - Click "Continue with Email" or GitHub

2. **Create Free Account**
   - Enter your email
   - Verify email
   - Complete registration

### Deploy Your Application

3. **Create New Project**
   - Click "Add New..." → "Project"
   - Choose "Import Git Repository"

4. **Upload Your Code**
   
   **Option A: Using GitHub (Recommended)**
   - Create GitHub account: https://github.com/signup
   - Create new repository
   - Upload all HollaClean files
   - Connect GitHub to Vercel
   - Import your repository

   **Option B: Using Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

5. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Add Environment Variables**
   - Go to project settings
   - Click "Environment Variables"
   - Add these (leave payment keys empty for now):
     ```
     VITE_APP_DOMAIN=hollaclean.com
     VITE_COMMISSION_RATE=0.20
     ```

7. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - You'll get a URL like: `hollaclean.vercel.app`

8. **Test Your Deployment**
   - Click the URL
   - Your app should load!
   - Test registration and browsing

---

## Step 3: Connect Custom Domain (15 minutes)

### Link Domain to Vercel

1. **In Vercel Dashboard**
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Add Domain"

2. **Add Your Domain**
   - Enter: `hollaclean.com`
   - Click "Add"

3. **Configure DNS**
   - Vercel will show you nameservers
   - Copy the nameservers

4. **Update Namecheap**
   - Go back to Namecheap tab
   - Click "Domain" → "Nameservers"
   - Select "Custom DNS"
   - Paste Vercel's nameservers:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
   - Click "Save"

5. **Wait for DNS Propagation**
   - Takes 10 minutes to 24 hours (usually 1-2 hours)
   - Check status: https://dnschecker.org
   - Enter your domain and check

6. **Add WWW Subdomain** (Optional)
   - In Vercel, add: `www.hollaclean.com`
   - This redirects www to main domain

---

## Step 4: Stripe Setup (30 minutes)

### Create Stripe Account

1. **Sign Up for Stripe**
   - Visit: https://dashboard.stripe.com/register
   - Enter email, create password
   - Verify email

2. **Activate Account**
   - Click "Activate your account"
   - Fill in business information:
     - Business name: "HollaClean"
     - Business type: "Individual" or "Company"
     - Industry: "Professional Services"
     - Country: "Canada"
     - Address: Your address in Ontario

3. **Verify Identity**
   - Upload ID (driver's license or passport)
   - Provide last 4 digits of SIN (if required)
   - This may take 24-48 hours for approval

### Get API Keys

4. **Get Your Keys**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - You'll see:
     - **Publishable key** (starts with `pk_test_`)
     - **Secret key** (click "Reveal", starts with `sk_test_`)

5. **Add Keys to Vercel**
   - Go to Vercel project
   - Settings → Environment Variables
   - Add:
     ```
     VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
     STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
     ```
   - Click "Save"

6. **Redeploy**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait 2-3 minutes

### Configure Stripe Connect (For Payouts to Cleaners)

7. **Enable Stripe Connect**
   - In Stripe dashboard, go to "Connect"
   - Click "Get Started"
   - Choose "Platform" model

8. **Set Up Connect Settings**
   - Platform name: "HollaClean"
   - Platform URL: `https://hollaclean.com`
   - Support email: your email

9. **Configure Payouts**
   - Go to Connect → Settings
   - Set payout schedule: "Daily" or "Weekly"
   - Enable "Standard" accounts for cleaners

### Test Payment Flow

10. **Test Mode Testing**
    - Use test card: `4242 4242 4242 4242`
    - Any future expiry date
    - Any 3-digit CVC
    - Create a test booking
    - Complete payment
    - Check Stripe dashboard for transaction

---

## Step 5: Switch to Production (5 minutes)

### Activate Live Mode

1. **Complete Stripe Activation**
   - Wait for identity verification
   - Usually takes 1-2 business days
   - You'll receive email when approved

2. **Get Live API Keys**
   - In Stripe, toggle to "Live mode" (top right)
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy live keys (start with `pk_live_` and `sk_live_`)

3. **Update Vercel Environment Variables**
   - Replace test keys with live keys:
     ```
     VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
     STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
     ```

4. **Redeploy**
   - Trigger new deployment
   - Wait 2-3 minutes

5. **Update Admin Password**
   ```
   ADMIN_PASSWORD=your_secure_password_here
   ```

---

## Step 6: SSL Certificate (Automatic)

Vercel automatically provides SSL (HTTPS) for your domain.

**Verify HTTPS:**
1. Visit `https://hollaclean.com`
2. Look for padlock icon in browser
3. Certificate should be valid

---

## Step 7: Final Testing (15 minutes)

### Test All Features

**As Homeowner:**
- [ ] Register new account
- [ ] Browse cleaners
- [ ] Create booking
- [ ] Make payment (use real card with small amount like $1)
- [ ] View bookings
- [ ] Leave review

**As Cleaner:**
- [ ] Register as professional
- [ ] Receive booking notification
- [ ] Accept booking
- [ ] Mark as complete
- [ ] Check earnings

**As Admin:**
- [ ] Login to admin dashboard
- [ ] View all bookings
- [ ] Check revenue reports
- [ ] View all users

**Mobile Testing:**
- [ ] Open on iPhone Safari
- [ ] Open on Android Chrome
- [ ] Test "Add to Home Screen"
- [ ] Test offline functionality

---

## Step 8: Go Live! 🚀

### Pre-Launch Checklist

- [ ] Domain working (hollaclean.com loads)
- [ ] HTTPS enabled (green padlock)
- [ ] Payments working (Stripe live mode)
- [ ] Test booking completed successfully
- [ ] Admin dashboard accessible
- [ ] Mobile app installable
- [ ] All pages load correctly

### Launch!

1. **Announce Launch**
   - Share on social media
   - Tell friends and family
   - Post in local Facebook groups

2. **Get First Cleaners**
   - Reach out to cleaning professionals
   - Offer early adopter benefits
   - Ask them to create profiles

3. **Get First Customers**
   - Offer launch discount
   - Ask cleaners to share with clients
   - Promote in local community groups

---

## Troubleshooting

### Domain Not Working
- Wait 24 hours for DNS propagation
- Check nameservers are correct
- Clear browser cache

### Payments Not Working
- Verify Stripe keys are correct
- Check if in test mode vs live mode
- Ensure Stripe account is activated

### App Not Loading
- Check Vercel deployment status
- View deployment logs for errors
- Ensure all environment variables are set

### PWA Not Installing
- Must be on HTTPS
- Check manifest.json is accessible
- Try different browser
- Clear cache and try again

---

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Namecheap Support:** https://www.namecheap.com/support/

---

## Next Steps After Launch

1. **Set up analytics** (Google Analytics)
2. **Configure email notifications** (SendGrid)
3. **Add SMS alerts** (Twilio)
4. **Implement background checks** for cleaners
5. **Add insurance verification**
6. **Create marketing materials**
7. **Build social media presence**
8. **Gather user feedback**

---

## Cost Summary

**One-Time:**
- Domain: $12-15 (annual)

**Monthly (free tier initially):**
- Hosting: $0 (Vercel free)
- Payments: 2.9% + $0.30 per transaction (Stripe)

**Your first $1,000 in bookings:**
- Revenue (20% commission): $200
- Stripe fees: ~$30
- **Net profit: ~$170**

---

## Congratulations! 🎉

Your HollaClean platform is now live and ready to connect homeowners with cleaning professionals!

Remember:
- Start small, grow steady
- Focus on quality over quantity
- Build trust with both cleaners and customers
- Listen to user feedback
- Keep improving

**You've got this! 💪**
