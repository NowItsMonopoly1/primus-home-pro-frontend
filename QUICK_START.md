# Quick Start Guide - PrimusInsights Roofing

Get up and running in 5 minutes.

---

## Prerequisites

- Node.js 16+ installed
- Twilio account (free trial works)
- Terminal/Command Prompt

---

## Setup (3 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit .env with your values
# Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE
```

**Get Twilio credentials:**
1. Go to [twilio.com/console](https://www.twilio.com/console)
2. Copy Account SID → `.env` as `TWILIO_ACCOUNT_SID`
3. Copy Auth Token → `.env` as `TWILIO_AUTH_TOKEN`
4. Buy a phone number → `.env` as `TWILIO_PHONE`

### 3. Start Server
```bash
npm start
```

You should see:
```
🚀 PrimusInsights running on port 10000
```

---

## Test It (2 minutes)

### Option A: Automated Test Suite

**Mac/Linux:**
```bash
chmod +x test-api.sh
./test-api.sh
```

**Windows:**
```cmd
test-api.bat
```

### Option B: Manual Test

**Submit a lead:**
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"John Doe","message":"I need roof repair"}'
```

**Expected response:**
```json
{
  "status": "success",
  "leadId": 1638360000000,
  "smsDelivered": true,
  "message": "Your request has been received and a confirmation SMS has been sent."
}
```

**View admin dashboard:**
Open in browser: `http://localhost:10000/admin?key=change-me-in-production`

---

## Test SMS Delivery

### 1. Setup ngrok (for Twilio webhook)
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 10000
```

### 2. Configure Twilio
1. Copy ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
2. Go to [Twilio Console → Phone Numbers](https://www.twilio.com/console/phone-numbers)
3. Click your number
4. Under "Messaging" → "A MESSAGE COMES IN"
5. Set webhook: `https://abc123.ngrok.io/sms`
6. Method: HTTP POST
7. Save

### 3. Test End-to-End
```bash
# Submit lead with YOUR phone number
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"YOUR_PHONE_HERE","name":"Your Name","message":"Testing SMS"}'
```

**Check your phone for SMS!**

### 4. Reply to SMS
Send any text message back to the Twilio number.

**You should receive:**
```
Thanks for reaching out! What type of roofing issue are you dealing with?
```

---

## Common Commands

### Development
```bash
npm run dev          # Auto-reload on file changes
npm start            # Production mode
```

### Testing
```bash
./test-api.sh        # Run full test suite (Mac/Linux)
test-api.bat         # Run full test suite (Windows)
```

### Admin Dashboard
```bash
# Open in browser
open http://localhost:10000/admin?key=change-me-in-production
```

### View Leads (JSON)
```bash
cat leads.json | jq '.'              # Mac/Linux (with jq)
type leads.json                      # Windows
```

### Clear All Leads
```bash
rm leads.json        # Mac/Linux
del leads.json       # Windows
```

---

## API Examples

### Submit Basic Lead
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15551234567",
    "name": "Jane Smith",
    "message": "I need my roof inspected"
  }'
```

### Submit Lead with Solar Interest
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15551234567",
    "name": "Solar Customer",
    "message": "Interested in solar panel installation",
    "solarInterest": true
  }'
```

### Test Validation (Should Fail)
```bash
# Missing fields
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567"}'

# Invalid phone
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"invalid","name":"Test","message":"Test message"}'
```

---

## Folder Structure

```
primus-insights-roofing/
├── index.js              # Main server (295 lines)
├── leads.json            # Auto-generated storage
├── package.json          # Dependencies
├── .env                  # Your config (DO NOT COMMIT)
├── .env.example          # Template
├── .gitignore            # Excludes secrets
│
├── README.md             # Full documentation
├── QUICK_START.md        # This file
├── TESTING.md            # Testing guide
├── IMPLEMENTATION_SUMMARY.md
│
├── test-api.sh           # Test script (Mac/Linux)
├── test-api.bat          # Test script (Windows)
├── vercel.json           # Frontend deploy config
└── render.yaml           # Backend deploy config
```

---

## Troubleshooting

### "Port 10000 already in use"
```bash
# Change port in .env
PORT=3000

# Or kill process
lsof -ti:10000 | xargs kill    # Mac/Linux
netstat -ano | findstr :10000  # Windows (find PID, then taskkill)
```

### "Cannot find module 'express'"
```bash
npm install
```

### "SMS not received"
- Check Twilio credentials in `.env`
- Verify phone number is verified (trial accounts)
- Check Twilio console logs for errors
- Make sure ngrok is running and webhook configured

### "Admin dashboard shows nothing"
- Check if `leads.json` exists
- Submit a test lead first
- Verify admin key matches `.env`

### "ENOENT: no such file or directory"
- Make sure you're in project root directory
- Run `npm start` from folder with `index.js`

---

## What's Next?

### Local Development
1. ✅ Complete Quick Start (you are here)
2. Read `TESTING.md` for comprehensive testing
3. Customize SMS message in `index.js:99-101`
4. Test with friends/family (5-10 people)

### Deploy to Production
1. Push code to GitHub
2. Deploy backend to [Render](https://render.com)
3. Deploy frontend to [Vercel](https://vercel.com)
4. Update Twilio webhook to production URL
5. Set strong `ADMIN_KEY` in production env vars

### Read Full Documentation
- `README.md` - Complete setup & deployment
- `TESTING.md` - All test scenarios
- `IMPLEMENTATION_SUMMARY.md` - Technical details

---

## Support

**Common Issues:**
- Check `TROUBLESHOOTING` section above
- Review `TESTING.md` for specific scenarios
- Check Twilio console for SMS delivery logs

**Twilio Help:**
- [Twilio SMS Quickstart](https://www.twilio.com/docs/sms/quickstart/node)
- [Twilio Console](https://www.twilio.com/console)

**ngrok Help:**
- [ngrok Documentation](https://ngrok.com/docs)

---

## Keyboard Shortcuts

### Stop Server
- `Ctrl+C` (all platforms)

### View Logs in Real-Time
```bash
npm start | grep "level"    # Mac/Linux
npm start | findstr "level" # Windows
```

### Quick Lead Submission (Alias)
```bash
# Add to .bashrc or .zshrc (Mac/Linux)
alias submit-lead='curl -X POST http://localhost:10000/lead -H "Content-Type: application/json" -d'

# Usage
submit-lead '{"phone":"+15551234567","name":"Quick Test","message":"Fast submission"}'
```

---

## Environment Variables Reference

```bash
# Required
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE=+15551234567

# Optional (with defaults)
ADMIN_KEY=change-me-in-production    # Default: change-me-in-production
PORT=10000                            # Default: 10000
NODE_ENV=development                  # Default: development
```

---

## Success Checklist

After Quick Start, you should have:

- [x] Server running on port 10000
- [x] Submitted at least one test lead
- [x] Viewed lead in admin dashboard
- [x] (Optional) Received SMS on your phone
- [x] (Optional) Replied to SMS and got auto-response

**If all checked → You're ready to deploy!**

---

## Next Steps

Choose your path:

**A. Continue Local Testing**
→ Read `TESTING.md` and run full test suite

**B. Deploy to Production**
→ Read `README.md` deployment section

**C. Customize for Your Business**
→ Edit SMS messages, add fields, customize admin UI

**D. Soft-Launch**
→ Test with 5-10 trusted customers

---

**Ready to launch? Let's go! 🚀**
