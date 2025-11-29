/**
 * Database Schema & Migration Module
 * Handles all database schema creation and migrations
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, process.env.DB_PATH || 'primus.db');
const LEADS_FILE = path.join(__dirname, 'leads.json');

/**
 * Initialize database with all tables
 */
export function initializeDatabase() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create schema version table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const currentVersion = getCurrentSchemaVersion(db);

  // Apply migrations
  if (currentVersion < 1) {
    applyMigration1(db);
  }
  if (currentVersion < 2) {
    applyMigration2(db);
  }
  if (currentVersion < 3) {
    applyMigration3(db);
  }

  return db;
}

/**
 * Get current schema version
 */
function getCurrentSchemaVersion(db) {
  try {
    const result = db.prepare('SELECT MAX(version) as version FROM schema_version').get();
    return result.version || 0;
  } catch (err) {
    return 0;
  }
}

/**
 * Migration 1: Original schema (leads table)
 */
function applyMigration1(db) {
  console.log('Applying migration 1: Initial schema');

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

    INSERT INTO schema_version (version) VALUES (1);
  `);

  console.log('Migration 1 complete');
}

/**
 * Migration 2: Multi-tenant schema (organizations, users, updated leads)
 */
function applyMigration2(db) {
  console.log('Applying migration 2: Multi-tenant schema');

  db.exec(`
    -- Organizations table
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company_name TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    -- Add organization_id and user_id to leads table
    ALTER TABLE leads ADD COLUMN organization_id INTEGER;
    ALTER TABLE leads ADD COLUMN user_id INTEGER;

    CREATE INDEX IF NOT EXISTS idx_leads_organization ON leads(organization_id);
    CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);

    -- Insert default organization for existing leads
    INSERT INTO organizations (name, company_name) VALUES ('Default Organization', 'Legacy Data');

    -- Update existing leads to belong to default organization
    UPDATE leads SET organization_id = 1 WHERE organization_id IS NULL;

    INSERT INTO schema_version (version) VALUES (2);
  `);

  console.log('Migration 2 complete');
}

/**
 * Migration 3: Billing & subscriptions schema
 */
function applyMigration3(db) {
  console.log('Applying migration 3: Billing & subscriptions');

  db.exec(`
    -- Add billing fields to organizations table
    ALTER TABLE organizations ADD COLUMN plan_id TEXT DEFAULT 'free';
    ALTER TABLE organizations ADD COLUMN stripe_customer_id TEXT;
    ALTER TABLE organizations ADD COLUMN stripe_subscription_id TEXT;
    ALTER TABLE organizations ADD COLUMN subscription_status TEXT DEFAULT 'active';
    ALTER TABLE organizations ADD COLUMN current_period_start TEXT;
    ALTER TABLE organizations ADD COLUMN current_period_end TEXT;
    ALTER TABLE organizations ADD COLUMN leads_this_month INTEGER DEFAULT 0;
    ALTER TABLE organizations ADD COLUMN leads_total INTEGER DEFAULT 0;

    CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan_id);
    CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

    INSERT INTO schema_version (version) VALUES (3);
  `);

  console.log('Migration 3 complete');
}

/**
 * Migrate existing JSON leads to database
 * This runs automatically on first startup if leads.json exists
 */
export async function migrateJSONToDatabase(db) {
  try {
    const jsonData = await fs.readFile(LEADS_FILE, 'utf8');
    const leads = JSON.parse(jsonData);

    const existingCount = db.prepare('SELECT COUNT(*) as count FROM leads').get().count;

    if (existingCount === 0 && leads.length > 0) {
      console.log(`Migrating ${leads.length} leads from JSON to database...`);

      // Ensure default organization exists
      const defaultOrg = db.prepare('SELECT id FROM organizations WHERE id = 1').get();
      if (!defaultOrg) {
        db.prepare('INSERT INTO organizations (id, name) VALUES (1, ?)').run('Default Organization');
      }

      const insert = db.prepare(`
        INSERT INTO leads (phone, name, message, solar_interest, timestamp, status, sms_delivered, sms_error, organization_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            lead.smsError || null,
            1 // default organization_id
          );
        }
      });

      migrate(leads);
      console.log(`Migration complete: ${leads.length} leads imported`);

      // Backup JSON file
      await fs.rename(LEADS_FILE, LEADS_FILE + '.backup');
      console.log('Original leads.json backed up');
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('JSON migration check failed:', err.message);
    }
  }
}

/**
 * Database helper functions
 */
export const dbHelpers = {
  // Get user by email
  getUserByEmail: (db, email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  // Get user by ID
  getUserById: (db, userId) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  },

  // Create new organization
  createOrganization: (db, data) => {
    const result = db.prepare(`
      INSERT INTO organizations (name, company_name, phone)
      VALUES (?, ?, ?)
    `).run(data.name, data.company_name || null, data.phone || null);

    return result.lastInsertRowid;
  },

  // Create new user
  createUser: (db, data) => {
    const result = db.prepare(`
      INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.organization_id,
      data.email,
      data.password_hash,
      data.first_name || null,
      data.last_name || null,
      data.role || 'user'
    );

    return result.lastInsertRowid;
  },

  // Update user last login
  updateUserLogin: (db, userId) => {
    db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
  },

  // Get leads for organization
  getLeadsByOrganization: (db, organizationId) => {
    return db.prepare(`
      SELECT
        id,
        phone,
        name,
        message,
        solar_interest as solarInterest,
        timestamp,
        status,
        sms_delivered as smsDelivered,
        sms_error as smsError,
        user_id as userId
      FROM leads
      WHERE organization_id = ?
      ORDER BY id DESC
    `).all(organizationId);
  },

  // Get leads for user
  getLeadsByUser: (db, userId) => {
    return db.prepare(`
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
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(userId);
  },

  // Create lead for user
  createLead: (db, data) => {
    const result = db.prepare(`
      INSERT INTO leads (phone, name, message, solar_interest, timestamp, status, sms_delivered, sms_error, organization_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.phone,
      data.name,
      data.message,
      data.solarInterest ? 1 : 0,
      data.timestamp,
      data.status,
      data.smsDelivered ? 1 : 0,
      data.smsError || null,
      data.organizationId,
      data.userId || null
    );

    return result.lastInsertRowid;
  }
};
