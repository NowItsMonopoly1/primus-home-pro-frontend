# 🚀 Quick Start Guide - PrimusHomePro

This guide will get you up and running in 5 minutes.

## ✅ Prerequisites Check

Before starting, ensure you have:
- [x] Node.js v18+ installed (`node --version`)
- [x] npm v9+ installed (`npm --version`)
- [x] Git installed
- [x] Twilio account (sign up at https://www.twilio.com)

## 📦 Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Return to root
cd ..
```

## 🔐 Step 2: Configure Environment Variables

### Backend Environment

1. Copy the example file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` with your Twilio credentials:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE=+1234567890
   OWNER_PHONE=+1234567890
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

### Where to Find Twilio Credentials

1. Go to https://console.twilio.com
2. **Account SID** and **Auth Token**: Dashboard home page
3. **Phone Number**: Phone Numbers → Manage → Active numbers

## 🎯 Step 3: Run the Application

### Option A: Run Everything (Recommended)
```bash
npm run dev
```

This starts both frontend (port 3000) and backend (port 5000) simultaneously.

### Option B: Run Separately
```bash
# Terminal 1 - Frontend
npm run dev:frontend

# Terminal 2 - Backend
npm run dev:backend
```

## 🌐 Step 4: Access the Application

Open your browser and visit:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

You should see:
- Frontend: Landing page with "Welcome to PrimusHomePro"
- Backend: JSON response with API status

## 🧪 Step 5: Verify Everything Works

### Quick Test

1. **Check Backend Health**:
   ```bash
   curl http://localhost:5000/health
   ```

   Expected response:
   ```json
   {
     "status": "ok",
     "message": "PrimusHomePro API is running",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **Check Frontend**:
   - Visit http://localhost:3000
   - You should see a clean landing page with CTA buttons

## 🛠️ Troubleshooting

### Port Already in Use

If you see "Port 3000 is already in use":
```bash
# Kill the process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies Issues

If packages fail to install:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

If you see TypeScript errors:
```bash
# Rebuild TypeScript
cd backend
npm run build

cd ../frontend
npm run build
```

## 📁 Project Structure Quick Reference

```
primus-home-pro/
├── frontend/          # Next.js app (port 3000)
│   └── app/          # App router pages
├── backend/          # Express API (port 5000)
│   └── src/          # TypeScript source
└── scripts/          # Helper scripts
```

## 🎓 Next Steps

Now that you're set up, you can:

1. **Customize the Landing Page**: Edit `frontend/app/page.tsx`
2. **Add API Routes**: Create files in `backend/src/routes/`
3. **Style Components**: Modify `frontend/app/globals.css`
4. **Add Twilio Integration**: Implement in `backend/src/services/`

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 💡 Pro Tips

1. **Use Concurrent Dev**: Always run `npm run dev` from root for best experience
2. **Check Logs**: Watch both terminal outputs for errors
3. **Hot Reload**: Both frontend and backend support hot reloading
4. **Environment**: Never commit `.env` files (already in `.gitignore`)

---

**Need help?** Check [README.md](./README.md) for full documentation.
