# PrimusHomePro

**Hybrid roofing + solar lead-capture & home-services platform**

PrimusHomePro is a full-stack web application designed for professional roofing and solar installation services. It combines modern web technologies with integrated lead capture, customer communication, and service management capabilities.

## 🏗️ Project Structure

```
primus-home-pro/
│
├── README.md
├── package.json              # Root package with workspace configuration
├── tsconfig.json            # Root TypeScript config
├── .gitignore
├── .env.example
│
├── frontend/                # Next.js 14 app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   ├── styles/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── scripts/                # Helper scripts, migrations, seeders
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18.x or higher
- **npm** v9.x or higher
- **Twilio Account** (for SMS notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd primus-home-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` in root and `backend/.env.example` to `backend/.env`:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

   Edit `backend/.env` and add your Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE=+1234567890
   OWNER_PHONE=+1234567890
   PORT=5000
   ```

4. **Run development servers**

   Run both frontend and backend concurrently:
   ```bash
   npm run dev
   ```

   Or run them separately:
   ```bash
   # Terminal 1 - Frontend
   npm run dev:frontend

   # Terminal 2 - Backend
   npm run dev:backend
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

## 📋 Available Scripts

### Root Level
- `npm run dev` - Run both frontend and backend concurrently
- `npm run dev:frontend` - Run frontend only
- `npm run dev:backend` - Run backend only
- `npm run build:frontend` - Build frontend for production
- `npm run build:backend` - Build backend for production

### Frontend
```bash
cd frontend
npm run dev       # Start Next.js dev server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Backend
```bash
cd backend
npm run dev       # Start Express dev server with hot reload
npm run build     # Compile TypeScript to JavaScript
npm run start     # Run compiled JavaScript
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **CSS3** - Styling

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Twilio** - SMS notifications
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```
TWILIO_ACCOUNT_SID=       # Your Twilio Account SID
TWILIO_AUTH_TOKEN=        # Your Twilio Auth Token
TWILIO_PHONE=             # Your Twilio phone number
OWNER_PHONE=              # Owner's phone for notifications
PORT=5000                 # Backend server port
NODE_ENV=development      # Environment (development/production)
FRONTEND_URL=http://localhost:3000  # Frontend URL for CORS
```

## 📦 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Set root directory to `frontend`
4. Set environment variables
5. Deploy

### Backend (Railway/Render/Heroku)
1. Push code to GitHub
2. Create new service
3. Set root directory to `backend`
4. Add environment variables
5. Deploy

## 🗺️ Roadmap

- [ ] Lead capture form with Twilio SMS integration
- [ ] Service request dashboard
- [ ] Calendar integration for appointments
- [ ] Quote calculator
- [ ] Customer portal
- [ ] Payment processing
- [ ] Analytics dashboard
- [ ] Multi-language support

## 📄 License

Private - All Rights Reserved

## 🤝 Contributing

This is a private project. If you have access and want to contribute, please follow these steps:

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📞 Support

For support, email your-email@example.com or contact via Twilio.

---

**Built with ❤️ for PrimusHomePro**
