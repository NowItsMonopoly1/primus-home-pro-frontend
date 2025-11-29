# 🌐 DNS Setup Guide - primushomepro.com

Complete guide to configure your domain for Vercel (frontend) + Render (backend).

---

## 📋 Overview

**Domain:** `primushomepro.com`
**Frontend:** Vercel (Next.js landing page)
**Backend:** Render (Express API)

**Target URLs:**
- Main site: `https://primushomepro.com` → Vercel frontend
- WWW: `https://www.primushomepro.com` → Redirects to main
- API: `https://api.primushomepro.com` → Render backend

---

## 🚀 Step-by-Step Setup

### Phase 1: Add Domain to Vercel (Frontend)

#### 1.1 Login to Vercel
- Go to https://vercel.com/dashboard
- Select your `primus-landing` project
- Click **Settings** → **Domains**

#### 1.2 Add Both Domains
Add these two domains:
1. `primushomepro.com` (apex/root domain)
2. `www.primushomepro.com` (www subdomain)

**Instructions:**
- Click **Add Domain**
- Enter `primushomepro.com`
- Click **Add**
- Repeat for `www.primushomepro.com`

#### 1.3 Note the DNS Records
Vercel will show you DNS records to configure. They'll look like:

**For apex domain (`primushomepro.com`):**
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

**Keep this page open** - you'll need these values for Step 2.

---

### Phase 2: Configure DNS at Your Registrar

#### Where is your domain registered?
- **GoDaddy?** Follow Section 2.1
- **Namecheap?** Follow Section 2.2
- **Cloudflare?** Follow Section 2.3
- **Other?** Follow general instructions below

---

#### 2.1 If Using GoDaddy

1. Login to https://dcc.godaddy.com/
2. Find `primushomepro.com` → Click **DNS**
3. Click **Add** under DNS Records

**Add Record 1: Apex Domain (A Record)**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600 seconds (or default)
```

**Add Record 2: WWW Subdomain (CNAME)**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 1 Hour
```

**Add Record 3: API Subdomain (CNAME)** *(for backend - add later)*
```
Type: CNAME
Name: api
Value: primus-insights-roofing.onrender.com
TTL: 1 Hour
```

4. Click **Save** for each record
5. **Important:** Delete any conflicting A or CNAME records for `@` or `www`

---

#### 2.2 If Using Namecheap

1. Login to https://www.namecheap.com/myaccount/
2. Find `primushomepro.com` → Click **Manage**
3. Go to **Advanced DNS** tab

**Add Record 1: Apex Domain (A Record)**
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic
```

**Add Record 2: WWW Subdomain (CNAME)**
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

**Add Record 3: API Subdomain (CNAME)** *(for backend)*
```
Type: CNAME Record
Host: api
Value: primus-insights-roofing.onrender.com
TTL: Automatic
```

4. Click **Save All Changes**
5. **Important:** Remove Namecheap's default parking page records

---

#### 2.3 If Using Cloudflare

1. Login to https://dash.cloudflare.com/
2. Select `primushomepro.com`
3. Go to **DNS** → **Records**

**Add Record 1: Apex Domain (A Record)**
```
Type: A
Name: @
IPv4 address: 76.76.21.21
Proxy status: Proxied (orange cloud)
TTL: Auto
```

**Add Record 2: WWW Subdomain (CNAME)**
```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy status: Proxied (orange cloud)
TTL: Auto
```

**Add Record 3: API Subdomain (CNAME)**
```
Type: CNAME
Name: api
Target: primus-insights-roofing.onrender.com
Proxy status: DNS only (grey cloud) - IMPORTANT
TTL: Auto
```

**⚠️ Important for Cloudflare:**
- Enable **SSL/TLS** → **Full (strict)** mode
- Turn OFF Cloudflare proxy for `api` subdomain (grey cloud)

4. Click **Save**

---

#### 2.4 General DNS Configuration (Any Provider)

If your provider isn't listed above, add these records:

| Type | Name/Host | Value/Target | TTL |
|------|-----------|--------------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 3600 |
| CNAME | api | primus-insights-roofing.onrender.com | 3600 |

**Common mistakes to avoid:**
- Don't include `https://` in CNAME values
- Don't add trailing dot unless your provider requires it
- Remove conflicting A/AAAA/CNAME records
- Use `@` for apex domain (some providers use blank field)

---

### Phase 3: Add Custom Domain to Render (Backend)

#### 3.1 Login to Render
- Go to https://dashboard.render.com/
- Select your backend service: `primus-insights-backend`

#### 3.2 Add Custom Domain
1. Click **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Enter: `api.primushomepro.com`
4. Click **Save**

Render will show verification status. Once DNS propagates, it will show "Verified" and auto-provision SSL certificate.

#### 3.3 Update Backend CORS
After domain is added, update your backend environment variables on Render:

1. Go to **Environment** tab
2. Find `ALLOWED_ORIGINS`
3. Update to:
```
https://primushomepro.com,https://www.primushomepro.com,http://localhost:3000
```
4. Click **Save Changes**
5. Service will auto-redeploy

---

### Phase 4: Update Frontend to Use Custom API Domain

#### 4.1 Update LeadForm Component

Edit: `primus-landing/app/components/LeadForm.tsx`

**Find line 31:**
```typescript
const response = await fetch(
  "https://primus-insights-roofing.onrender.com/lead",
```

**Replace with:**
```typescript
const response = await fetch(
  "https://api.primushomepro.com/lead",
```

#### 4.2 Create Environment Variable (Better Approach)

**Create:** `primus-landing/.env.local`
```env
NEXT_PUBLIC_API_URL=https://api.primushomepro.com
```

**Update LeadForm.tsx:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.primushomepro.com";

const response = await fetch(`${API_URL}/lead`, {
```

#### 4.3 Add to Vercel Environment Variables
1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://api.primushomepro.com`
   - Environments: Production, Preview, Development
3. Click **Save**
4. Redeploy: **Deployments** → Latest → **Redeploy**

---

### Phase 5: Verification & Testing

#### 5.1 Check DNS Propagation (15 min - 48 hours)

**Online tools:**
- https://dnschecker.org/
- https://www.whatsmydns.net/

Enter `primushomepro.com` and check:
- ✅ A record points to Vercel IP
- ✅ CNAME for `www` points to Vercel
- ✅ CNAME for `api` points to Render

**Command line:**
```bash
# Check apex domain
nslookup primushomepro.com

# Check www
nslookup www.primushomepro.com

# Check api
nslookup api.primushomepro.com
```

#### 5.2 Verify SSL Certificates

**Frontend (Vercel):**
1. Go to Vercel → Project → Settings → Domains
2. Both domains should show **Valid Configuration** with 🔒 icon
3. SSL certificates auto-provision (takes 1-5 minutes)

**Backend (Render):**
1. Go to Render → Service → Settings → Custom Domains
2. `api.primushomepro.com` should show **Verified**
3. SSL certificate auto-provisions (takes 1-10 minutes)

#### 5.3 Test Each URL

**Test frontend:**
```bash
# Should show your landing page
curl -I https://primushomepro.com
curl -I https://www.primushomepro.com
```

**Test backend API:**
```bash
# Should return JSON with status: success/ok
curl https://api.primushomepro.com/
```

**Test admin dashboard:**
```bash
# In browser, should show admin panel
https://api.primushomepro.com/admin?key=YOUR_ADMIN_KEY
```

#### 5.4 End-to-End Lead Submission Test

1. Visit `https://primushomepro.com`
2. Fill out lead form with your phone number
3. Submit form
4. Verify:
   - ✅ Form shows success message
   - ✅ You receive SMS on your phone
   - ✅ Lead appears in admin: `https://api.primushomepro.com/admin?key=YOUR_KEY`
   - ✅ No console errors in browser DevTools

---

## 🚨 Troubleshooting

### Issue: "Domain verification failed" on Vercel

**Solution:**
- Wait 15-30 minutes after adding DNS records
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Verify DNS records are correct (no typos)
- Remove conflicting records at registrar

### Issue: "SSL certificate pending" on Vercel

**Solution:**
- Wait up to 24 hours for DNS propagation
- Ensure DNS records point to correct IPs
- Check that domain is verified (green checkmark)
- Try removing and re-adding domain

### Issue: API calls fail with CORS error

**Solution:**
- Verify `ALLOWED_ORIGINS` includes your domain
- Redeploy backend after changing environment variables
- Clear browser cache
- Check Network tab in DevTools for exact error

### Issue: "This site can't be reached"

**Solution:**
- DNS hasn't propagated yet (wait 24-48 hours)
- Check DNS records at registrar
- Use incognito/private browsing to avoid cache
- Test from different network/device

### Issue: www doesn't work but apex does (or vice versa)

**Solution:**
- Ensure both domains added to Vercel
- Check CNAME record for `www` is correct
- Verify no conflicting A records for `www`
- Set up redirect in Vercel: Settings → Domains → Redirect

---

## 📊 DNS Records Summary (Copy-Paste Ready)

### For Registrar DNS Panel:

```
Record Type: A
Host/Name: @
Value/IP: 76.76.21.21
TTL: 600

Record Type: CNAME
Host/Name: www
Value/Target: cname.vercel-dns.com
TTL: 3600

Record Type: CNAME
Host/Name: api
Value/Target: primus-insights-roofing.onrender.com
TTL: 3600
```

**Remove these if they exist:**
- Any A record for `www`
- Any AAAA (IPv6) records
- Parking page redirects
- Default registrar records

---

## ⏱️ Timeline Expectations

| Task | Expected Time |
|------|---------------|
| Add domain to Vercel | 5 minutes |
| Configure DNS records | 10 minutes |
| DNS propagation | 15 min - 48 hours |
| SSL certificate provisioning | 1-10 minutes (after DNS) |
| Add domain to Render | 5 minutes |
| Update frontend code | 10 minutes |
| Deploy changes | 5 minutes |
| End-to-end testing | 15 minutes |
| **Total** | **1 hour - 2 days** |

**Most likely:** 2-4 hours including DNS propagation

---

## ✅ Final Checklist

Before going live, verify:

- [ ] Both `primushomepro.com` and `www.primushomepro.com` added to Vercel
- [ ] DNS A record for apex domain configured
- [ ] DNS CNAME for `www` configured
- [ ] DNS CNAME for `api` configured
- [ ] Old/conflicting DNS records removed
- [ ] SSL certificates show as active on Vercel (🔒 icon)
- [ ] Custom domain added to Render backend
- [ ] Backend CORS updated with production domains
- [ ] Frontend API URL updated to `api.primushomepro.com`
- [ ] Frontend redeployed with new environment variables
- [ ] End-to-end form submission works
- [ ] SMS delivery works
- [ ] Admin dashboard accessible
- [ ] No console errors in production

---

## 🎉 You're Live!

Once all checks pass, your platform is production-ready at:

- **Main site:** https://primushomepro.com
- **API:** https://api.primushomepro.com
- **Admin:** https://api.primushomepro.com/admin?key=YOUR_KEY

**Next steps:**
- Share with friends/family for soft launch
- Monitor admin dashboard for leads
- Track SMS delivery rates
- Collect user feedback
- Consider Google Analytics / monitoring

---

**Need help?** Check these resources:
- Vercel Domains: https://vercel.com/docs/domains
- Render Custom Domains: https://render.com/docs/custom-domains
- DNS Checker: https://dnschecker.org/

Good luck with your launch! 🚀
