# Testing Guide - PrimusInsights Roofing Backend

## Quick Start Testing (5 minutes)

### 1. Start the server
```bash
npm install
npm start
```

### 2. Test the /lead endpoint
```bash
# Valid lead
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"John Smith","message":"I need a roof inspection","solarInterest":true}'
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

### 3. View the admin dashboard
Open in browser: `http://localhost:10000/admin?key=change-me-in-production`

You should see the lead displayed in the dashboard.

---

## Comprehensive Test Cases

### Test 1: Valid Lead Submission
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15551234567",
    "name": "Jane Doe",
    "message": "Need roof repair after storm damage",
    "solarInterest": false
  }'
```

**Expected:**
- Status 200
- Lead saved to `leads.json`
- SMS sent to customer
- Visible in admin dashboard

### Test 2: Missing Required Fields
```bash
# Missing message
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"Test User"}'
```

**Expected:**
- Status 400
- Error: "Missing required fields: phone, name, and message are required"

### Test 3: Invalid Phone Format
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"123","name":"Test User","message":"Test message here"}'
```

**Expected:**
- Status 400
- Error: "Invalid phone number format. Please use a valid US phone number."

### Test 4: Name Too Short
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"A","message":"Test message here"}'
```

**Expected:**
- Status 400
- Error: "Name must be between 2 and 100 characters"

### Test 5: Message Too Short
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"Test User","message":"Hi"}'
```

**Expected:**
- Status 400
- Error: "Message must be between 5 and 500 characters"

### Test 6: Solar Interest Flag
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"Solar Customer","message":"Interested in solar panels too","solarInterest":true}'
```

**Expected:**
- Status 200
- Admin dashboard shows solar badge

### Test 7: Multiple Leads
```bash
# Submit 5 leads
for i in {1..5}; do
  curl -X POST http://localhost:10000/lead \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"+155512345$i$i\",\"name\":\"Customer $i\",\"message\":\"Test message number $i\"}"
done
```

**Expected:**
- Admin dashboard shows 5 leads
- Stats counters update

### Test 8: Admin Access - Valid Key
```bash
curl "http://localhost:10000/admin?key=change-me-in-production"
```

**Expected:**
- Status 200
- HTML dashboard

### Test 9: Admin Access - Invalid Key
```bash
curl "http://localhost:10000/admin?key=wrong-key"
```

**Expected:**
- Status 401
- "401 Unauthorized"

### Test 10: Admin Access - No Key
```bash
curl "http://localhost:10000/admin"
```

**Expected:**
- Status 401
- "401 Unauthorized"

---

## Twilio Integration Testing

### Prerequisites
1. Valid Twilio account with SMS-capable phone number
2. Environment variables configured:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE`

### Test SMS Delivery

**Step 1:** Submit a lead with YOUR phone number:
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"YOUR_PHONE_HERE","name":"Your Name","message":"Testing SMS delivery"}'
```

**Step 2:** Check your phone for SMS within 5 seconds

**Expected SMS:**
```
Thanks Your Name! We received your message about roofing. A specialist will reach out shortly to discuss your needs.
```

### Test Twilio Webhook (Incoming SMS)

**Step 1:** Start ngrok tunnel:
```bash
ngrok http 10000
```

**Step 2:** Copy ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Step 3:** Configure Twilio:
- Go to Twilio Console → Phone Numbers → Active Numbers
- Click your number
- Under "Messaging" → "A MESSAGE COMES IN"
- Set webhook to: `https://abc123.ngrok.io/sms`
- Method: HTTP POST
- Save

**Step 4:** Send SMS from your phone to Twilio number:
```
"Hello, I have questions about roofing"
```

**Step 5:** Check response SMS on your phone

**Expected response:**
```
Thanks for reaching out! What type of roofing issue are you dealing with?
```

---

## Storage Persistence Testing

### Test 1: Verify leads.json Creation
```bash
# Submit a lead
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"Test","message":"Testing storage"}'

# Check file exists
cat leads.json
```

**Expected:**
- `leads.json` file created in project root
- Valid JSON array with lead object

### Test 2: Server Restart Persistence
```bash
# Submit lead
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"Before Restart","message":"Test persistence"}'

# Stop server (Ctrl+C)
# Restart server
npm start

# Check admin dashboard
# Lead should still be visible
```

### Test 3: Concurrent Writes (Basic)
```bash
# Submit multiple leads in parallel
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551111111","name":"User 1","message":"Concurrent test 1"}' &

curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15552222222","name":"User 2","message":"Concurrent test 2"}' &

curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15553333333","name":"User 3","message":"Concurrent test 3"}' &

wait
```

**Expected:**
- All 3 leads saved
- Admin dashboard shows 3 leads
- No data corruption in leads.json

**⚠️ Note:** At high volume, JSON file writes may have race conditions. This is acceptable for MVP but should migrate to database for production.

---

## Error Handling Testing

### Test 1: Twilio Failure (Invalid Credentials)
```bash
# Temporarily set invalid Twilio credentials in .env
# TWILIO_ACCOUNT_SID=invalid
# TWILIO_AUTH_TOKEN=invalid

# Restart server and submit lead
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"Test","message":"Testing SMS failure"}'
```

**Expected:**
- Status 200 (lead still accepted)
- Response: `"smsDelivered": false`
- Lead saved to storage with `status: "sms_failed"`
- Error logged in console

### Test 2: Invalid Phone Number (Twilio Rejection)
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+19999999999","name":"Test","message":"Invalid number test"}'
```

**Expected:**
- Lead passes validation (correct format)
- Twilio rejects during SMS send
- Lead still saved with `status: "sms_failed"`
- Error logged

### Test 3: Malformed JSON
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{invalid json}'
```

**Expected:**
- Status 400
- Express default error handler

---

## Log Verification

### Check Structured Logs
```bash
# Submit lead and watch logs
npm start | grep "level"
```

**Expected log sequence:**
```json
{"timestamp":"...","level":"info","message":"Server started","port":10000}
{"timestamp":"...","level":"info","message":"Incoming lead request","phone":"4567","name":"Test"}
{"timestamp":"...","level":"info","message":"SMS sent successfully","leadId":123,"sid":"SM..."}
{"timestamp":"...","level":"info","message":"Lead saved to storage","leadId":123,"totalLeads":1}
{"timestamp":"...","level":"info","message":"Lead processed successfully","leadId":123,"duration":1200,"smsDelivered":true}
```

---

## Performance Testing (Basic)

### Load Test - 100 Leads
```bash
# Install Apache Bench (or use existing)
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpd (ab included)

# Test endpoint performance
ab -n 100 -c 10 -p lead.json -T "application/json" http://localhost:10000/lead
```

**lead.json:**
```json
{"phone":"+15551234567","name":"Load Test User","message":"Performance testing lead submission"}
```

**Expected:**
- All requests succeed (200)
- Average response time < 2000ms (depends on Twilio)
- Admin dashboard shows 100 leads

---

## Soft-Launch Testing Checklist

Use this checklist for real-world testing with 5-10 friends/family:

- [ ] **Setup**
  - [ ] Production .env configured (real Twilio credentials)
  - [ ] Strong ADMIN_KEY set
  - [ ] ngrok or deployed to Render
  - [ ] Twilio webhook configured

- [ ] **Lead Submission**
  - [ ] Submit lead via frontend form (if built)
  - [ ] Submit lead via cURL directly
  - [ ] Verify SMS received within 10 seconds
  - [ ] Check SMS content is correct and professional

- [ ] **Validation**
  - [ ] Try submitting with invalid phone (should reject)
  - [ ] Try submitting with missing name (should reject)
  - [ ] Try submitting with empty message (should reject)
  - [ ] Verify error messages are user-friendly

- [ ] **Admin Dashboard**
  - [ ] Access with correct key
  - [ ] Verify all leads visible
  - [ ] Check stats are accurate
  - [ ] Verify solar interest flag displays correctly
  - [ ] Check timestamps are correct

- [ ] **SMS Conversation**
  - [ ] Reply to initial SMS
  - [ ] Verify auto-response received
  - [ ] Check conversation logs

- [ ] **Error Scenarios**
  - [ ] Submit lead while server is down (frontend should handle)
  - [ ] Submit lead with Twilio API down
  - [ ] Access admin with wrong key
  - [ ] Check logs for any errors

- [ ] **Persistence**
  - [ ] Submit leads
  - [ ] Restart server
  - [ ] Verify leads still in dashboard

- [ ] **Monitoring**
  - [ ] Check server logs for errors
  - [ ] Monitor Twilio console for SMS delivery
  - [ ] Verify no data loss

---

## Browser Testing (Admin Dashboard)

### Desktop Browsers
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Mobile Browsers
- [ ] iOS Safari
- [ ] Android Chrome

**Test:**
- Dashboard loads correctly
- Stats display properly
- Table is readable
- Responsive on mobile

---

## Security Testing (Basic)

### Test 1: SQL Injection (Not Applicable)
No database, but verify message content is properly escaped in admin HTML.

### Test 2: XSS Prevention
```bash
curl -X POST http://localhost:10000/lead \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567","name":"<script>alert(\"XSS\")</script>","message":"Test XSS"}'
```

Check admin dashboard - script should be HTML-escaped and not execute.

### Test 3: Admin Brute Force
Try accessing admin with random keys - no rate limiting currently (note for future).

---

## Cleanup After Testing

```bash
# Remove test leads
rm leads.json

# Restart server to start fresh
npm start
```

---

## Troubleshooting

**Issue:** SMS not received
- Check Twilio credentials in .env
- Verify phone number is verified in Twilio (for trial accounts)
- Check Twilio console logs for delivery status

**Issue:** Admin dashboard shows "No leads"
- Check if leads.json exists
- Verify file has valid JSON
- Check file permissions

**Issue:** "ENOENT" error
- Ensure you're running from project root
- Check file paths in index.js

**Issue:** Port already in use
- Change PORT in .env
- Or kill process: `lsof -ti:10000 | xargs kill`
