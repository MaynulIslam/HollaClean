# Quick Start Guide for Complete Beginners

**Never coded before? No problem!** This guide will walk you through launching HollaClean step by step.

## What You're Building

A website where:
- Homeowners find cleaning professionals
- Cleaners get jobs
- You earn 20% commission on every booking

## Total Cost: $12 (just the domain)
## Total Time: 2 hours

---

## Step 1: Buy Your Domain (15 minutes)

**What's a domain?** It's your website address (like google.com)

1. Go to **Namecheap.com**
2. Search for "hollaclean" (or your preferred name)
3. Click "Add to Cart"
4. Checkout - Cost: ~$12/year
5. Create account with email and password
6. Complete purchase

✅ **Done!** You now own hollaclean.com

---

## Step 2: Create Free Hosting Account (10 minutes)

**What's hosting?** Where your website lives on the internet

1. Go to **Vercel.com**
2. Click "Sign Up"
3. Use "Continue with Email" or GitHub
4. Verify your email
5. You're in!

✅ **Done!** You have free hosting forever

---

## Step 3: Get Your Files Ready (5 minutes)

You have all these files. You need to upload them to Vercel.

**Two Ways to Do This:**

### Option A: Using GitHub (Recommended)

1. Go to **GitHub.com**
2. Sign up for free account
3. Click green "New" button
4. Name it: "hollaclean"
5. Click "Create repository"
6. Click "uploading an existing file"
7. Drag ALL your HollaClean files
8. Click "Commit changes"

✅ Files are now on GitHub!

### Option B: Using Vercel CLI (Slightly Technical)

Skip this if you used Option A.

---

## Step 4: Deploy to Vercel (20 minutes)

**Make your website go live!**

1. In Vercel dashboard, click "Add New..."
2. Click "Project"
3. Click "Import Git Repository"
4. Choose your GitHub account
5. Select "hollaclean" repository
6. Click "Import"

**Configure Settings:**
- Framework Preset: `Vite`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`

7. Click "Deploy"
8. Wait 2-3 minutes ☕

✅ **Your site is live!** You'll see a URL like: `hollaclean.vercel.app`

---

## Step 5: Connect Your Domain (15 minutes)

**Make it load at hollaclean.com instead of vercel.app**

### In Vercel:
1. Go to your project
2. Click "Settings" → "Domains"
3. Type: `hollaclean.com`
4. Click "Add"
5. Vercel shows you 2 nameservers (copy these!)

### In Namecheap:
1. Go to your Namecheap account
2. Click "Domain List"
3. Click "Manage" next to hollaclean.com
4. Find "Nameservers" section
5. Select "Custom DNS"
6. Paste Vercel's 2 nameservers
7. Click "Save"

**Wait:** 30 minutes to 24 hours for changes to take effect

✅ **Done!** Soon hollaclean.com will load your site

---

## Step 6: Set Up Payments (30 minutes)

**So you can actually get paid!**

### Create Stripe Account:

1. Go to **Stripe.com**
2. Click "Sign Up"
3. Enter email and create password
4. Choose country: "Canada"

### Fill in Business Info:

5. Business name: "HollaClean" (or your legal name)
6. Type: "Individual" (if it's just you)
7. Industry: "Professional Services"
8. Your address in Ontario
9. Upload photo of your ID (driver's license)
10. Wait for approval (1-2 days)

### Get Your Keys:

11. In Stripe, click "Developers" → "API keys"
12. You see two keys:
    - **Publishable key** (starts with `pk_test_`)
    - **Secret key** (click Reveal, starts with `sk_test_`)
13. Copy both keys

### Add to Vercel:

14. Go back to Vercel
15. Your project → "Settings" → "Environment Variables"
16. Add these:

```
Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_YOUR_KEY_HERE

Name: STRIPE_SECRET_KEY
Value: sk_test_YOUR_KEY_HERE

Name: VITE_COMMISSION_RATE
Value: 0.20

Name: ADMIN_PASSWORD
Value: your_secure_password
```

17. Click "Save"
18. Go to "Deployments" tab
19. Click "..." on latest deployment
20. Click "Redeploy"
21. Wait 2 minutes

✅ **Done!** Payments are working

---

## Step 7: Test Everything (15 minutes)

### Test on Computer:

1. Go to `hollaclean.com`
2. Click "Homeowner"
3. Fill in registration form
4. Browse cleaners
5. Try creating a booking

### Test on Phone:

1. Open Chrome (Android) or Safari (iPhone)
2. Go to `hollaclean.com`
3. You should see "Add to Home Screen" option
4. Add it - icon appears on your phone!
5. Open from home screen - it looks like an app!

### Test Payment (Important!):

1. Create a real booking
2. Use test card: `4242 4242 4242 4242`
3. Expiry: any future date (12/28)
4. CVC: any 3 digits (123)
5. Complete payment
6. Check Stripe dashboard - you should see the payment!

✅ **Everything works!**

---

## Step 8: Go Live (5 minutes)

**Switch from test mode to real money**

### When Stripe Approves Your Account:

1. In Stripe, toggle to "Live Mode" (top right)
2. Go to "API keys"
3. Copy your **Live** keys (start with `pk_live_` and `sk_live_`)
4. In Vercel → Settings → Environment Variables
5. Edit the Stripe keys, replace with live ones
6. Redeploy

✅ **You're accepting real payments!**

---

## Step 9: Get Your First Users (Ongoing)

### Get Cleaners:

1. **Post in Facebook Groups:**
   - Join "Ontario Cleaning Professionals"
   - Join "GTA House Cleaners"
   - Post: "New platform for cleaners to find clients!"

2. **Kijiji:**
   - Post free ad in "Services" section
   - "Get more clients - Join HollaClean"

3. **Ask Friends:**
   - Know anyone who cleans?
   - Tell them about your platform

### Get Customers:

1. **Facebook Marketplace:**
   - List cleaning services
   - Link to hollaclean.com

2. **Local Groups:**
   - Join neighborhood Facebook groups
   - Post: "Find trusted cleaners in [Your City]"

3. **Launch Offer:**
   - First 50 customers get 20% off
   - Share on social media

---

## Common Problems & Solutions

### "My domain isn't working!"
**Solution:** Wait 24 hours. DNS can be slow. Check at dnschecker.org

### "Payments aren't working"
**Solution:** 
- Make sure you used the right Stripe keys
- Check if you're in test mode vs live mode
- Look at Stripe dashboard for error messages

### "The app won't install on my phone"
**Solution:**
- Make sure you're using HTTPS (green padlock)
- Try a different browser
- Clear cache and try again

### "I can't find my files"
**Solution:** You should have received:
- hollaclean-complete.jsx
- package.json
- manifest.json
- README.md
- And more...

---

## You're Done! 🎉

Your cleaning marketplace is now live!

### What happens next?

1. **First Week:**
   - Share with friends and family
   - Get 3-5 cleaners signed up
   - Get your first booking!

2. **First Month:**
   - Focus on quality over quantity
   - Get reviews from satisfied customers
   - Aim for 20-30 bookings

3. **First 3 Months:**
   - Build reputation
   - Focus on one city/area
   - Grow organically

### Remember:

- Start small
- Focus on quality
- Listen to feedback
- Keep improving
- Don't give up!

---

## Still Confused?

That's okay! Here's what to do:

1. **Read the full README.md** - More detailed
2. **Check DEPLOYMENT.md** - Step-by-step with screenshots
3. **Review STRIPE_SETUP.md** - Payment details
4. **Watch YouTube tutorials** on:
   - "How to use GitHub"
   - "How to deploy to Vercel"
   - "Setting up Stripe payments"

---

## Quick Reference

**Your URLs:**
- Website: hollaclean.com
- Admin: hollaclean.com (admin login at bottom)
- Vercel Dashboard: vercel.com/dashboard
- Stripe Dashboard: dashboard.stripe.com
- Domain: namecheap.com

**Important Passwords:**
- Vercel: [your email/password]
- Stripe: [your email/password]
- Admin: [set in environment variables]
- Domain: [namecheap login]

**Save these somewhere safe!**

---

## Costs Breakdown

**To Start:**
- Domain: $12/year

**Per Booking:**
- You earn: 20% of booking
- Stripe takes: 2.9% + $0.30
- Net profit: ~16.8% of booking

**Example:**
- Customer books $100 cleaning
- You get: $20 (20%)
- Stripe fee: $3.20
- Your profit: $16.80 ✨

---

## Support

Need help? Here's what to do:

1. **Google is your friend:** Search your error message
2. **Read the docs:** README.md has most answers
3. **Check Stripe help:** They have great docs
4. **Vercel support:** vercel.com/support
5. **Ask for help:** Post in web dev communities

---

## Final Checklist

Before you tell anyone about your site:

- [ ] Website loads at hollaclean.com
- [ ] You can register as homeowner
- [ ] You can register as cleaner
- [ ] You can create a booking
- [ ] Payment works (tested with test card)
- [ ] Mobile app installs
- [ ] Admin panel accessible
- [ ] Your bank account linked to Stripe

**All checked? Start promoting! 📣**

---

## Congratulations! 🎊

You just launched a business!

Most people never take action. You did.

Now go get your first customer! 💪

---

**Questions?** Re-read this guide. 90% of questions are answered here.

**Still stuck?** That's normal. Google the error. Try again. You got this!

**Excited?** You should be! You're an entrepreneur now! 🚀
