# 🌐 Domain Setup Guide - primushomepro.com → Production

Complete step-by-step guide to configure `primushomepro.com` for your PrimusHomePro platform.

---

## 📋 Quick Overview

**What you're setting up:**
- `primushomepro.com` → Frontend (Vercel landing page)
- `www.primushomepro.com` → Redirects to main site
- `api.primushomepro.com` → Backend API (Render)

**Time required:** 1-2 hours (+ DNS propagation time)

---

## ✅ Prerequisites

Before starting, ensure you have:
- [x] Domain `primushomepro.com` registered and owned by you
- [x] Access to domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
- [x] Backend deployed on Render: `primus-insights-roofing.onrender.com`
- [x] Frontend code ready in `primus-landing/` directory
- [ ] GitHub account (for Vercel deployment)
- [ ] Vercel account (free tier is fine)

---

## 🚀 Step-by-Step Setup

### STEP 1: Deploy Frontend to Vercel (15 minutes)

#### 1A. Push Code to GitHub (if not done)

```bash
# Navigate to your project
cd "c:\Users\Donte\Downloads\Primus insights roofing"

# Check if git is initialized
git status

# If not initialized:
git init
git add .
git commit -m "Production-ready PrimusHomePro platform"
git branch -M main

# Create new repo on GitHub: https://github.com/new
# Name it: primus-home-pro

# Link and push
git remote add origin https://github.com/YOUR_USERNAME/primus-home-pro.git
git push -u origin main
```

#### 1B. Deploy to Vercel

1. Go to https://vercel.com/signup (sign up with GitHub)
2. Click **Add New...** → **Project**
3. **Import Git Repository** → Select `primus-home-pro`
4. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** Click **Edit** → Enter: `primus-landing`
   - **Build Command:** `npm run build` (auto)
   - **Output Directory:** `.next` (auto)
   - **Install Command:** `npm install` (auto)

5. **Environment Variables** (click to expand):
   ```
   NEXT_PUBLIC_API_URL = https://api.primushomepro.com
   ```
   *(We'll use this later after DNS is configured)*

6. Click **Deploy**
7. Wait 2-3 minutes

**Result:** Your site is live at `https://your-project-name.vercel.app`

**Test it:** Visit the Vercel URL and verify the landing page loads.

---

### STEP 2: Add Custom Domain to Vercel (10 minutes)

#### 2A. Add primushomepro.com

1. In Vercel dashboard → Your project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `primushomepro.com`
4. Click **Add**
5. Vercel will show DNS configuration needed

#### 2B. Add www.primushomepro.com

1. Click **Add Domain** again
2. Enter: `www.primushomepro.com`
3. Click **Add**

#### 2C. Note the DNS Records

Vercel will display records similar to:

**For apex domain (primushomepro.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Important:** Keep this page open or screenshot these values. You'll need them next.

---

### STEP 3: Configure DNS at Your Registrar (15 minutes)

#### Where is primushomepro.com registered?

**Find out:**
- Check your email for domain purchase confirmation
- Or use WHOIS lookup: https://who.is/whois/primushomepro.com

**Common registrars:** GoDaddy, Namecheap, Google Domains, Cloudflare

---

#### Option A: GoDaddy

1. Login to https://dcc.godaddy.com/
2. Find `primushomepro.com` → Click **DNS**
3. **Remove existing records:**
   - Delete any A records for `@`
   - Delete any CNAME for `www`
   - Delete parking page records

4. **Add new records:**

**Record 1:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600 seconds
```

**Record 2:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 1 Hour
```

**Record 3:**
```
Type: CNAME
Name: api
Value: primus-insights-roofing.onrender.com
TTL: 1 Hour
```

5. Click **Save** for each record

---

#### Option B: Namecheap

1. Login to https://www.namecheap.com/
2. **Domain List** → Find `primushomepro.com` → Click **Manage**
3. Click **Advanced DNS** tab
4. **Remove existing records:**
   - Delete Namecheap parking page
   - Delete any conflicting A/CNAME records

5. **Add new records:**

**Record 1:**
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

**Record 2:**
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com.
TTL: Automatic
```

**Record 3:**
```
Type: CNAME Record
Host: api
Value: primus-insights-roofing.onrender.com.
TTL: Automatic
```

6. Click **Save All Changes**

---

#### Option C: Cloudflare

1. Login to https://dash.cloudflare.com/
2. Select `primushomepro.com`
3. Click **DNS** → **Records**
4. **Remove old records** (if any)

5. **Add new records:**

**Record 1:**
```
Type: A
Name: @
IPv4 address: 76.76.21.21
Proxy status: Proxied (🟠 orange cloud)
TTL: Auto
```

**Record 2:**
```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy status: Proxied (🟠 orange cloud)
TTL: Auto
```

**Record 3:**
```
Type: CNAME
Name: api
Target: primus-insights-roofing.onrender.com
Proxy status: DNS only (⚪ grey cloud) ← IMPORTANT
TTL: Auto
```

6. **SSL/TLS Settings:**
   - Go to **SSL/TLS** → **Overview**
   - Set to **Full (strict)**

7. Click **Save**

**Note:** Turn OFF proxy (grey cloud) for `api` subdomain to allow Render's SSL to work.

---

### STEP 4: Wait for DNS Propagation (15 min - 48 hours)

DNS changes take time to spread globally.

#### Check DNS Status

**Online checker:**
- Go to https://dnschecker.org/
- Enter `primushomepro.com`
- Should show IP: `76.76.21.21`

**Command line:**
```bash
# Windows
nslookup primushomepro.com

# Expected result:
# Address: 76.76.21.21
```

**Typical times:**
- Minimum: 15-30 minutes
- Average: 2-4 hours
- Maximum: 48 hours

**What to do while waiting:**
- Complete Step 5 (Render domain setup)
- Test backend directly
- Prepare social media posts

---

### STEP 5: Add Custom Domain to Render Backend (5 minutes)

#### 5A. Add Domain

1. Go to https://dashboard.render.com/
2. Select your service: `primus-insights-roofing`
3. Click **Settings** (left sidebar)
4. Scroll to **Custom Domains**
5. Click **Add Custom Domain**
6. Enter: `api.primushomepro.com`
7. Click **Save**

**Status will show:**
- Initial: "Verifying..." (orange)
- After DNS: "Verified" (green) + SSL certificate auto-provisions

#### 5B. Update CORS Settings

1. While in Render dashboard → **Environment** tab
2. Find variable: `ALLOWED_ORIGINS`
3. Click **Edit**
4. Update value to:
```
https://primushomepro.com,https://www.primushomepro.com,http://localhost:3000
```
5. Click **Save Changes**

**Note:** Render will automatically redeploy (takes 1-2 minutes)

---

### STEP 6: Update Frontend API URL (10 minutes)

#### 6A. Update LeadForm Component

Edit file: `primus-landing/app/components/LeadForm.tsx`

**Find line 31:**
```typescript
const response = await fetch(
  "https://primus-insights-roofing.onrender.com/lead",
```

**Replace with:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.primushomepro.com";

const response = await fetch(
  `${API_URL}/lead`,
```

#### 6B. Create Environment File (Optional but recommended)

Create: `primus-landing/.env.local`
```env
NEXT_PUBLIC_API_URL=https://api.primushomepro.com
```

Add to `.gitignore`:
```
.env.local
```

#### 6C. Commit and Push

```bash
cd "c:\Users\Donte\Downloads\Primus insights roofing"
git add .
git commit -m "Update API URL to custom domain"
git push
```

**Vercel will auto-deploy** (2-3 minutes)

---

### STEP 7: Verify SSL Certificates (After DNS propagates)

#### 7A. Check Vercel Domains

1. Vercel → Project → **Settings** → **Domains**
2. Look for:
   - `primushomepro.com` → **Valid Configuration** ✅ 🔒
   - `www.primushomepro.com` → **Valid Configuration** ✅ 🔒

**If pending:**
- Wait 5-10 minutes after DNS verification
- Vercel auto-provisions Let's Encrypt SSL certificates

#### 7B. Check Render Domain

1. Render → Service → **Settings** → **Custom Domains**
2. `api.primushomepro.com` should show:
   - Status: **Verified** ✅
   - SSL: **Active** 🔒

**If pending:**
- Ensure DNS CNAME is correct
- Wait up to 10 minutes
- Render auto-provisions SSL

---

### STEP 8: Test Everything (15 minutes)

#### 8A. Test Frontend

**Visit in browser:**
```
https://primushomepro.com
https://www.primushomepro.com
```

**Verify:**
- [ ] Page loads successfully
- [ ] HTTPS works (🔒 green padlock in address bar)
- [ ] No console errors (F12 → Console tab)
- [ ] Dark theme loads correctly
- [ ] Lead form is visible

#### 8B. Test Backend API

**Browser test:**
```
https://api.primushomepro.com/
```

**Expected:** JSON response like:
```json
{
  "status": "ok",
  "message": "PrimusInsights API"
}
```

**Test admin dashboard:**
```
https://api.primushomepro.com/admin?key=YOUR_ADMIN_KEY
```

**Expected:** Admin panel with leads table

#### 8C. Test Lead Submission (Critical!)

1. Go to `https://primushomepro.com`
2. Fill out lead form:
   - **Name:** Your Name
   - **Phone:** YOUR_ACTUAL_PHONE_NUMBER
   - **Message:** "Testing production deployment"
3. Click **Request roof inspection**
4. Wait 5-10 seconds

**Verify:**
- [ ] Form shows success message
- [ ] Lead ID is displayed (e.g., #0001)
- [ ] SMS received on your phone
- [ ] No errors in browser console

5. Check admin dashboard:
```
https://api.primushomepro.com/admin?key=YOUR_KEY
```

**Verify:**
- [ ] Your test lead appears in table
- [ ] Status shows "sms_sent"
- [ ] Timestamp is correct

---

## ✅ Production Launch Checklist

Once all tests pass:

### Security
- [ ] Twilio credentials are in environment variables (not in code)
- [ ] Admin key is secure and random
- [ ] HTTPS enforced on all URLs
- [ ] CORS limited to production domains
- [ ] Rate limiting active

### Functionality
- [ ] Frontend loads on custom domain
- [ ] Backend API accessible
- [ ] Lead form submits successfully
- [ ] SMS delivery works
- [ ] Admin dashboard accessible
- [ ] No console errors

### Performance
- [ ] Page load time < 3 seconds
- [ ] Form submission < 2 seconds
- [ ] SMS delivery < 10 seconds

### Monitoring
- [ ] Vercel analytics enabled (Settings → Analytics)
- [ ] Render logs accessible
- [ ] Twilio console bookmarked
- [ ] Admin dashboard bookmarked

---

## 🎉 You're Live!

Your platform is now accessible at:

**Public URLs:**
- Main site: `https://primushomepro.com`
- API: `https://api.primushomepro.com`
- Admin: `https://api.primushomepro.com/admin?key=YOUR_KEY`

---

## 📣 Soft Launch Plan

### Day 1: Friends & Family Test
Share with 5-10 close contacts:

```
Hey! I just launched my new roofing lead platform at:
https://primushomepro.com

Would you mind testing it? Just fill out the form with your real phone number and let me know if you get the SMS.

Thanks for helping! 🙏
```

### Day 2-7: Monitor & Fix
- Check admin dashboard twice daily
- Track lead volume and SMS success rate
- Fix any bugs reported
- Collect UX feedback

### Week 2: Limited Public Launch
- Share on social media
- Post in local community groups
- Consider small Google Ads budget ($50-100)

---

## 🚨 Common Issues & Fixes

### Issue: "This site can't be reached"
**Cause:** DNS not propagated yet
**Fix:**
- Wait 24-48 hours
- Check DNS with `nslookup primushomepro.com`
- Try different network or incognito mode

### Issue: SSL certificate pending
**Cause:** DNS verification not complete
**Fix:**
- Verify DNS records are correct
- Wait 10-30 minutes after DNS verification
- Remove and re-add domain in Vercel

### Issue: Form submission fails with CORS error
**Cause:** CORS misconfiguration
**Fix:**
- Verify `ALLOWED_ORIGINS` in Render includes your domain
- Redeploy backend after changing environment
- Clear browser cache

### Issue: SMS not sending
**Cause:** Twilio credentials or backend issue
**Fix:**
- Check Twilio credentials in Render environment
- Verify phone format is valid
- Check Render logs for errors
- Test with Twilio console directly

---

## 📊 What to Monitor

### Daily (First Week)
- Lead submission count (admin dashboard)
- SMS delivery success rate
- Render logs for errors
- Form abandonment (Vercel analytics)

### Weekly
- Total leads vs. previous week
- SMS failure patterns
- User feedback themes
- Cost tracking (Twilio, Render, Vercel)

---

## 💰 Monthly Cost Estimate

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (Free) | $0 |
| Render | Free tier | $0 |
| Twilio SMS | Pay-per-use | ~$0.01/SMS |
| Domain | Annual renewal | ~$1/month |
| **Total** | | **~$1-5/month** |

**Upgrade path (recommended after 100+ leads):**
- Render Starter: $7/month (prevents spin-down)
- Vercel Pro: $20/month (better analytics)

---

## 🔄 Next Phase Features

After successful soft launch:

### Phase 2: AI Conversation
- Replace mock SMS with real AI
- Implement conversation context
- Add booking/scheduling

### Phase 3: CRM Dashboard
- Replace basic admin page
- Add lead filtering/search
- Export leads to CSV
- Lead status management

### Phase 4: Analytics & Optimization
- Google Analytics integration
- Conversion tracking
- A/B testing
- SEO optimization

---

## 📞 Support Resources

**Documentation:**
- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Twilio Docs: https://www.twilio.com/docs

**Tools:**
- DNS Checker: https://dnschecker.org/
- SSL Checker: https://www.sslshopper.com/ssl-checker.html
- PageSpeed Insights: https://pagespeed.web.dev/

**Your Project:**
- Frontend Code: `primus-landing/`
- Backend Code: `index.js`
- DNS Guide: [DNS_SETUP_GUIDE.md](./DNS_SETUP_GUIDE.md)

---

## ✨ Congratulations!

You've successfully deployed a production-ready SaaS platform. This is a major milestone!

**What you've built:**
- Professional landing page
- Automated lead capture
- SMS integration
- Admin dashboard
- Custom domain
- SSL security
- Scalable infrastructure

**Time to celebrate 🎉 then get those first real leads!**

---

**Last Updated:** 2024-01-01
**Status:** Production Ready
**Next Action:** Configure DNS and go live
