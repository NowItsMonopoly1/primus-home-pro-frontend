import express from "express";
import twilio from "twilio";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import validator from "validator";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security: Helmet for HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for admin dashboard
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

// Security: Rate limiting for lead submissions
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many lead submissions from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Rate limiting for admin access
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many admin requests, please try again later.' }
});

// Security: General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(apiLimiter);
app.use(express.json({ limit: '10kb' })); // Limit payload size

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const LEADS_FILE = path.join(__dirname, "leads.json");
const DB_PATH = path.join(__dirname, process.env.DB_PATH || "primus.db");
const ADMIN_KEY = process.env.ADMIN_KEY || "change-me-in-production";

// Initialize SQLite database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better concurrency

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    solar_interest INTEGER DEFAULT 0,
    timestamp TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    sms_delivered INTEGER DEFAULT 0,
    sms_error TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
  CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
`);

// Migrate existing JSON data to database (one-time operation)
async function migrateJSONToDatabase() {
  try {
    const jsonData = await fs.readFile(LEADS_FILE, 'utf8');
    const leads = JSON.parse(jsonData);

    const existingCount = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
    if (existingCount === 0 && leads.length > 0) {
      log('info', 'Migrating JSON data to database', { count: leads.length });

      const insert = db.prepare(`
        INSERT INTO leads (phone, name, message, solar_interest, timestamp, status, sms_delivered, sms_error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const migrate = db.transaction((leadsToMigrate) => {
        for (const lead of leadsToMigrate) {
          insert.run(
            lead.phone,
            lead.name,
            lead.message,
            lead.solarInterest ? 1 : 0,
            lead.timestamp,
            lead.status || 'new',
            lead.smsDelivered ? 1 : 0,
            lead.smsError || null
          );
        }
      });

      migrate(leads);
      log('info', 'Migration complete', { migratedCount: leads.length });

      // Backup JSON file after migration
      await fs.rename(LEADS_FILE, LEADS_FILE + '.backup');
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      log('warn', 'Migration check failed', { error: err.message });
    }
  }
}

// Run migration on startup
migrateJSONToDatabase().catch(err => log('error', 'Migration error', { error: err.message }));

// Logging utility
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({ timestamp, level, message, ...data }));
}

// Security: Input sanitization helpers
function sanitizeInput(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  return validator.escape(input.trim().substring(0, maxLength));
}

// Validate US phone number (enhanced with validator)
function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return validator.isMobilePhone(cleaned, 'en-US') || /^\+?1?\d{10,11}$/.test(cleaned);
}

// 🔥 SAFE MOCK AI (no external API calls)
async function getAIResponse(message) {
  return "Thanks for reaching out! What type of roofing issue are you dealing with?";
}

// --- LEAD ENDPOINT (with validation, persistence, error handling) ---
app.post("/lead", leadLimiter, async (req, res) => {
  const startTime = Date.now();
  let leadId = null;

  try {
    const { phone, name, message, solarInterest } = req.body || {};

    log("info", "Incoming lead request", { phone: phone?.slice(-4), name });

    // Security: Validation with sanitization
    if (!phone || !name || !message) {
      log("warn", "Validation failed: missing required fields", { phone: !!phone, name: !!name, message: !!message });
      return res.status(400).json({ error: "Missing required fields: phone, name, and message are required" });
    }

    // Security: Sanitize inputs
    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedMessage = sanitizeInput(message, 500);
    const cleanedPhone = phone.trim();

    if (!isValidPhone(cleanedPhone)) {
      log("warn", "Validation failed: invalid phone format", { phone: cleanedPhone?.slice(-4) });
      return res.status(400).json({ error: "Invalid phone number format. Please use a valid US phone number." });
    }

    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      log("warn", "Validation failed: invalid name length");
      return res.status(400).json({ error: "Name must be between 2 and 100 characters" });
    }

    if (sanitizedMessage.length < 5 || sanitizedMessage.length > 500) {
      log("warn", "Validation failed: invalid message length");
      return res.status(400).json({ error: "Message must be between 5 and 500 characters" });
    }

    // Security: Check for duplicate recent submissions (spam prevention)
    const recentDuplicate = db.prepare(`
      SELECT id FROM leads
      WHERE phone = ? AND message = ?
      AND datetime(timestamp) > datetime('now', '-5 minutes')
    `).get(cleanedPhone, sanitizedMessage);

    if (recentDuplicate) {
      log("warn", "Duplicate submission detected", { phone: cleanedPhone?.slice(-4) });
      return res.status(429).json({ error: "Duplicate submission detected. Please wait a few minutes before resubmitting." });
    }

    // Prepare lead data
    const timestamp = new Date().toISOString();
    let smsDelivered = 0;
    let status = 'new';
    let smsError = null;

    // Mock AI response (use sanitized name for display)
    const aiReply =
      `Thanks ${sanitizedName}! We received your message about roofing. ` +
      `A specialist will reach out shortly to discuss your needs.`;

    // Send SMS via Twilio (critical path)
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
      log("error", "Failed to send SMS", { error: smsErr.message, code: smsErr.code });
      status = "sms_failed";
      smsError = smsErr.message;
      // Don't fail the entire request - still save the lead
    }

    // Save to database (atomic operation with transaction)
    try {
      const insert = db.prepare(`
        INSERT INTO leads (phone, name, message, solar_interest, timestamp, status, sms_delivered, sms_error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insert.run(
        cleanedPhone,
        sanitizedName,
        sanitizedMessage,
        solarInterest ? 1 : 0,
        timestamp,
        status,
        smsDelivered,
        smsError
      );

      leadId = result.lastInsertRowid;
      log("info", "Lead saved to database", { leadId, status, smsDelivered: !!smsDelivered });
    } catch (dbErr) {
      log("error", "Failed to save lead to database", { error: dbErr.message });
      // If we can't save, this IS a critical failure
      return res.status(500).json({
        error: "Unable to save your request. Please try again.",
      });
    }

    const duration = Date.now() - startTime;
    log("info", "Lead processed successfully", { leadId, duration, smsDelivered: !!smsDelivered });

    return res.json({
      status: "success",
      leadId,
      smsDelivered: !!smsDelivered,
      message: smsDelivered
        ? "Your request has been received and a confirmation SMS has been sent."
        : "Your request has been received. We'll contact you shortly."
    });

  } catch (err) {
    const duration = Date.now() - startTime;
    log("error", "Unexpected error in /lead", { leadId, error: err.message, stack: err.stack, duration });
    return res.status(500).json({
      error: "An unexpected error occurred. Please try again later.",
      leadId
    });
  }
});

// Incoming SMS webhook
app.post("/sms", async (req, res) => {
  try {
    const from = req.body.From;
    const body = req.body.Body;

    log("info", "Incoming SMS", { from: from?.slice(-4), bodyLength: body?.length });

    const aiMessage = await getAIResponse(body);

    await client.messages.create({
      body: aiMessage,
      from: process.env.TWILIO_PHONE,
      to: from
    });

    log("info", "SMS reply sent", { to: from?.slice(-4) });
    res.send("<Response></Response>");
  } catch (err) {
    log("error", "Error in /sms webhook", { error: err.message });
    res.status(200).send("<Response></Response>");
  }
});

// Admin interface (basic auth via query param)
app.get("/admin", adminLimiter, async (req, res) => {
  try {
    const { key } = req.query;

    if (key !== ADMIN_KEY) {
      log("warn", "Unauthorized admin access attempt");
      return res.status(401).send("<h1>401 Unauthorized</h1><p>Invalid admin key.</p>");
    }

    // Fetch leads from database
    const leads = db.prepare(`
      SELECT
        id,
        phone,
        name,
        message,
        solar_interest as solarInterest,
        timestamp,
        status,
        sms_delivered as smsDelivered,
        sms_error as smsError
      FROM leads
      ORDER BY id DESC
    `).all();

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
    h1 { margin-bottom: 20px; color: #333; }
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
  <h1>🏠 PrimusInsights Roofing - Leads Dashboard</h1>

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

  ${leads.length === 0 ? '<div class="empty">No leads yet. Waiting for first submission...</div>' : `
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

    log("info", "Admin dashboard accessed", { totalLeads: leads.length });
    res.send(html);

  } catch (err) {
    log("error", "Error in /admin", { error: err.message });
    res.status(500).send("<h1>500 Error</h1><p>Unable to load dashboard.</p>");
  }
});

app.listen(process.env.PORT || 10000, () => {
  log("info", "Server started", { port: process.env.PORT || 10000 });
  console.log("🚀 PrimusInsights running on port", process.env.PORT || 10000);
});
