#!/usr/bin/env node
/**
 * Database Status Check Utility
 * Quick tool to inspect the SQLite database
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, process.env.DB_PATH || 'primus.db');

try {
  const db = new Database(DB_PATH, { readonly: true });

  console.log('📊 PrimusInsights Database Status\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Total leads
  const total = db.prepare('SELECT COUNT(*) as count FROM leads').get();
  console.log(`Total Leads: ${total.count}`);

  // By status
  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM leads
    GROUP BY status
  `).all();

  console.log('\n📈 By Status:');
  statusCounts.forEach(row => {
    console.log(`  ${row.status}: ${row.count}`);
  });

  // SMS delivery rate
  const smsStats = db.prepare(`
    SELECT
      SUM(sms_delivered) as delivered,
      COUNT(*) - SUM(sms_delivered) as failed
    FROM leads
  `).get();

  console.log('\n📱 SMS Delivery:');
  console.log(`  Delivered: ${smsStats.delivered || 0}`);
  console.log(`  Failed: ${smsStats.failed || 0}`);
  if (total.count > 0) {
    const rate = ((smsStats.delivered || 0) / total.count * 100).toFixed(1);
    console.log(`  Success Rate: ${rate}%`);
  }

  // Solar interest
  const solarCount = db.prepare('SELECT COUNT(*) as count FROM leads WHERE solar_interest = 1').get();
  console.log(`\n☀️ Solar Interest: ${solarCount.count}`);

  // Recent leads
  const recent = db.prepare(`
    SELECT name, timestamp, status
    FROM leads
    ORDER BY id DESC
    LIMIT 5
  `).all();

  if (recent.length > 0) {
    console.log('\n🕐 Recent Leads:');
    recent.forEach(lead => {
      const date = new Date(lead.timestamp).toLocaleString();
      console.log(`  ${date} - ${lead.name} (${lead.status})`);
    });
  }

  // Database info
  const dbInfo = db.prepare(`
    SELECT
      page_count * page_size as size,
      page_count,
      page_size
    FROM pragma_page_count(), pragma_page_size()
  `).get();

  console.log('\n💾 Database Info:');
  console.log(`  Size: ${(dbInfo.size / 1024).toFixed(2)} KB`);
  console.log(`  Pages: ${dbInfo.page_count}`);

  // WAL mode check
  const walMode = db.prepare('PRAGMA journal_mode').get();
  console.log(`  Journal Mode: ${walMode.journal_mode}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  db.close();

} catch (err) {
  if (err.code === 'SQLITE_CANTOPEN') {
    console.error('❌ Database not found. Run the server first to create it.');
    console.error(`   Expected location: ${DB_PATH}`);
  } else {
    console.error('❌ Error:', err.message);
  }
  process.exit(1);
}
