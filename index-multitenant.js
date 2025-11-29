import express from "express";
import twilio from "twilio";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import validator from "validator";
import dotenv from "dotenv";

import { initializeDatabase, migrateJSONToDatabase, dbHelpers } from "./database.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
  requireAuth,
  requireRole,
  isValidEmail,
  isValidPassword,
  sanitizeUser
} from "./auth.js";

// Load environment variables
dotenv.config();

const app = express();

// Security: Helmet for HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));

// Security: CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:10000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Security: Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many lead submissions from this IP, please try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(apiLimiter);
app.use(express.json({ limit: '10kb' }));

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize database
const db = initializeDatabase();
migrateJSONToDatabase(db).catch(err => log('error', 'Migration error', { error: err.message }));

// Logging utility
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, message, ...data }));
}

// Security: Input sanitization
function sanitizeInput(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  return validator.escape(input.trim().substring(0, maxLength));
}

// Validate US phone number
function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return validator.isMobilePhone(cleaned, 'en-US') || /^\+?1?\d{10,11}$/.test(cleaned);
}

// Mock AI response
async function getAIResponse(message) {
  return "Thanks for reaching out! What type of roofing issue are you dealing with?";
}

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/auth/register
 * Register new user and organization
 */
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName, companyPhone } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number'
      });
    }

    // Check if user exists
    const existingUser = dbHelpers.getUserByEmail(db, email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create organization
    const organizationId = dbHelpers.createOrganization(db, {
      name: companyName || `${firstName}'s Organization`,
      company_name: companyName,
      phone: companyPhone
    });

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = dbHelpers.createUser(db, {
      organization_id: organizationId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: 'admin' // First user is admin
    });

    const user = dbHelpers.getUserById(db, userId);
    const token = generateToken(user);

    log('info', 'User registered', { userId, email, organizationId });

    res.status(201).json({
      token,
      user: sanitizeUser(user)
    });

  } catch (err) {
    log('error', 'Registration error', { error: err.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = dbHelpers.getUserByEmail(db, email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    dbHelpers.updateUserLogin(db, user.id);
    const token = generateToken(user);

    log('info', 'User logged in', { userId: user.id, email });

    res.json({
      token,
      user: sanitizeUser(user)
    });

  } catch (err) {
    log('error', 'Login error', { error: err.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = dbHelpers.getUserById(db, req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    log('error', 'Get user error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============================================================================
// LEAD ENDPOINTS (Multi-tenant)
// ============================================================================

/**
 * POST /api/lead
 * Create new lead (authenticated - associates with user's organization)
 */
app.post("/api/lead", requireAuth, leadLimiter, async (req, res) => {
  const startTime = Date.now();

  try {
    const { phone, name, message, solarInterest } = req.body;

    log("info", "Incoming lead request", { phone: phone?.slice(-4), name, userId: req.user.userId });

    // Validation
    if (!phone || !name || !message) {
      return res.status(400).json({ error: "Missing required fields: phone, name, and message are required" });
    }

    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedMessage = sanitizeInput(message, 500);
    const cleanedPhone = phone.trim();

    if (!isValidPhone(cleanedPhone)) {
      return res.status(400).json({ error: "Invalid phone number format. Please use a valid US phone number." });
    }

    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return res.status(400).json({ error: "Name must be between 2 and 100 characters" });
    }

    if (sanitizedMessage.length < 5 || sanitizedMessage.length > 500) {
      return res.status(400).json({ error: "Message must be between 5 and 500 characters" });
    }

    // Check for duplicates
    const recentDuplicate = db.prepare(`
      SELECT id FROM leads
      WHERE organization_id = ? AND phone = ? AND message = ?
      AND datetime(timestamp) > datetime('now', '-5 minutes')
    `).get(req.user.organizationId, cleanedPhone, sanitizedMessage);

    if (recentDuplicate) {
      return res.status(429).json({ error: "Duplicate submission detected. Please wait a few minutes before resubmitting." });
    }

    // Send SMS
    const aiReply = `Thanks ${sanitizedName}! We received your message about roofing. A specialist will reach out shortly to discuss your needs.`;
    let smsDelivered = 0;
    let status = 'new';
    let smsError = null;

    try {
      const smsResult = await client.messages.create({
        body: aiReply,
        from: process.env.TWILIO_PHONE,
        to: cleanedPhone,
      });
      smsDelivered = 1;
      status = "sms_sent";
      log("info", "SMS sent successfully", { sid: smsResult.sid });
    } catch (smsErr) {
      log("error", "Failed to send SMS", { error: smsErr.message });
      status = "sms_failed";
      smsError = smsErr.message;
    }

    // Save to database
    const leadId = dbHelpers.createLead(db, {
      phone: cleanedPhone,
      name: sanitizedName,
      message: sanitizedMessage,
      solarInterest,
      timestamp: new Date().toISOString(),
      status,
      smsDelivered,
      smsError,
      organizationId: req.user.organizationId,
      userId: req.user.userId
    });

    const duration = Date.now() - startTime;
    log("info", "Lead processed successfully", { leadId, duration, smsDelivered: !!smsDelivered });

    res.json({
      status: "success",
      leadId,
      smsDelivered: !!smsDelivered,
      message: smsDelivered
        ? "Your request has been received and a confirmation SMS has been sent."
        : "Your request has been received. We'll contact you shortly."
    });

  } catch (err) {
    const duration = Date.now() - startTime;
    log("error", "Unexpected error in /api/lead", { error: err.message, stack: err.stack, duration });
    res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
  }
});

/**
 * GET /api/leads
 * Get all leads for authenticated user's organization
 */
app.get("/api/leads", requireAuth, async (req, res) => {
  try {
    const leads = dbHelpers.getLeadsByOrganization(db, req.user.organizationId);

    log("info", "Leads fetched", { userId: req.user.userId, count: leads.length });

    res.json({ leads });
  } catch (err) {
    log("error", "Error fetching leads", { error: err.message });
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// ============================================================================
// ADMIN DASHBOARD (Legacy - now requires auth)
// ============================================================================

app.get("/admin", requireAuth, async (req, res) => {
  try {
    const leads = dbHelpers.getLeadsByOrganization(db, req.user.organizationId);
    const user = dbHelpers.getUserById(db, req.user.userId);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>PrimusInsights Admin - Leads Dashboard</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 20px; background: #f5f5f5; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    h1 { color: #333; }
    .user-info { text-align: right; color: #666; font-size: 14px; }
    .stats { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
    .stat { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; min-width: 150px; }
    .stat h3 { font-size: 14px; color: #666; margin-bottom: 5px; }
    .stat p { font-size: 28px; font-weight: bold; color: #333; }
    table { width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    th { background: #333; color: white; padding: 12px; text-align: left; font-weight: 600; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f9f9f9; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge.success { background: #d4edda; color: #155724; }
    .badge.warning { background: #fff3cd; color: #856404; }
    .badge.danger { background: #f8d7da; color: #721c24; }
    .badge.solar { background: #cfe2ff; color: #084298; }
    .phone { font-family: monospace; }
    .empty { text-align: center; padding: 60px 20px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏠 PrimusInsights Roofing - Leads Dashboard</h1>
    <div class="user-info">
      <strong>${user.first_name || ''} ${user.last_name || ''}</strong><br>
      ${user.email}<br>
      <span style="font-size: 12px; color: #999;">Role: ${user.role}</span>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <h3>Total Leads</h3>
      <p>${leads.length}</p>
    </div>
    <div class="stat">
      <h3>SMS Delivered</h3>
      <p>${leads.filter(l => l.smsDelivered).length}</p>
    </div>
    <div class="stat">
      <h3>SMS Failed</h3>
      <p>${leads.filter(l => l.status === 'sms_failed').length}</p>
    </div>
    <div class="stat">
      <h3>Solar Interest</h3>
      <p>${leads.filter(l => l.solarInterest).length}</p>
    </div>
  </div>

  ${leads.length === 0 ? '<div class="empty">No leads yet. Start adding leads via API!</div>' : `
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Timestamp</th>
        <th>Name</th>
        <th>Phone</th>
        <th>Message</th>
        <th>Status</th>
        <th>Solar</th>
      </tr>
    </thead>
    <tbody>
      ${leads.map(lead => `
        <tr>
          <td>${lead.id}</td>
          <td>${new Date(lead.timestamp).toLocaleString()}</td>
          <td><strong>${validator.unescape(lead.name)}</strong></td>
          <td class="phone">${lead.phone}</td>
          <td>${validator.unescape(lead.message)}</td>
          <td>
            <span class="badge ${lead.status === 'sms_sent' ? 'success' : lead.status === 'sms_failed' ? 'danger' : 'warning'}">
              ${lead.status}
            </span>
          </td>
          <td>
            ${lead.solarInterest ? '<span class="badge solar">☀️ YES</span>' : '—'}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  `}
</body>
</html>
    `;

    log("info", "Admin dashboard accessed", { userId: req.user.userId, totalLeads: leads.length });
    res.send(html);

  } catch (err) {
    log("error", "Error in /admin", { error: err.message });
    res.status(500).send("<h1>500 Error</h1><p>Unable to load dashboard.</p>");
  }
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(process.env.PORT || 10000, () => {
  log("info", "Server started", { port: process.env.PORT || 10000 });
  console.log("🚀 PrimusInsights Multi-Tenant running on port", process.env.PORT || 10000);
});
