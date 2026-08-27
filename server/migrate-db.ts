/**
 * Database migration script
 * This script will be run automatically when the application starts
 * It adds password authentication support to the users table
 */

import { getDb } from './db';

async function ensureAdminAccessLoginTokenTable(db: any) {
  // Store only a SHA-256 hash of each short-lived email login token.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_access_login_tokens (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      token_hash VARCHAR(64) NOT NULL,
      email VARCHAR(320) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY admin_access_login_tokens_token_hash_unique (token_hash),
      KEY idx_admin_access_login_tokens_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureSeoMonitoringTables(db: any) {
  // Store only public URL-level technical health. No search traffic, credentials, or personal data.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS seo_monitoring_runs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      status ENUM('running','completed','failed') NOT NULL DEFAULT 'running',
      target_count INT NOT NULL,
      healthy_count INT NOT NULL DEFAULT 0,
      unhealthy_count INT NOT NULL DEFAULT 0,
      alert_sent TINYINT NOT NULL DEFAULT 0,
      started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      KEY idx_seo_monitoring_runs_started_at (started_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS seo_monitoring_url_results (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      run_id INT NOT NULL,
      target_key VARCHAR(32) NOT NULL,
      url VARCHAR(500) NOT NULL,
      http_status INT NULL,
      canonical_valid TINYINT NOT NULL DEFAULT 0,
      robots_indexable TINYINT NOT NULL DEFAULT 0,
      ssr_content_present TINYINT NOT NULL DEFAULT 0,
      structured_data_valid TINYINT NOT NULL DEFAULT 0,
      image_accessible TINYINT NULL,
      failure_code VARCHAR(64) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_seo_monitoring_url_results_run_id (run_id),
      KEY idx_seo_monitoring_url_results_target_key (target_key, created_at),
      CONSTRAINT fk_seo_monitoring_url_results_run FOREIGN KEY (run_id)
        REFERENCES seo_monitoring_runs(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function ensureInquiryNotificationEventTable(db: any) {
  // No message body, contact information, SMTP response, or token is stored here.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS inquiry_notification_events (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      message_id INT NULL,
      event_type ENUM('new_message','daily_summary','sla24','sla48') NOT NULL,
      dedupe_key VARCHAR(191) NOT NULL,
      status ENUM('pending','retry','sent','failed') NOT NULL DEFAULT 'pending',
      attempt_count INT NOT NULL DEFAULT 0,
      next_attempt_at TIMESTAMP NOT NULL,
      sent_at TIMESTAMP NULL,
      last_error_code VARCHAR(64) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY inquiry_notification_events_dedupe_unique (dedupe_key),
      KEY idx_inquiry_notification_events_message_id (message_id),
      KEY idx_inquiry_notification_events_status_due (status, next_attempt_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function migrateDatabase() {
  const db = await getDb();
  if (!db) {
    console.warn('[Migration] Database not available, skipping migration');
    return;
  }

  try {
    console.log('[Migration] Starting database migration...');

    // Check if passwordHash column exists
    const checkColumnQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'passwordHash'
    `;
    
    const result = await db.execute(checkColumnQuery);
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('[Migration] passwordHash column already exists, skipping migration');
      await ensureAdminAccessLoginTokenTable(db);
      await ensureInquiryNotificationEventTable(db);
      await ensureSeoMonitoringTables(db);
      console.log('[Migration] ✓ Ensured administrator access, notification, and SEO monitoring tables');
      return;
    }

    console.log('[Migration] Adding password authentication support...');

    // Step 1: Modify openId to be nullable
    await db.execute('ALTER TABLE users MODIFY COLUMN openId VARCHAR(64) NULL');
    console.log('[Migration] ✓ Modified openId to be nullable');

    // Step 2: Add password hash column
    await db.execute('ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) NULL');
    console.log('[Migration] ✓ Added passwordHash column');

    // Step 3: Make email unique and not null (if not already)
    try {
      await db.execute('ALTER TABLE users MODIFY COLUMN email VARCHAR(320) NOT NULL');
      console.log('[Migration] ✓ Modified email to be NOT NULL');
    } catch (error) {
      console.log('[Migration] Email column already NOT NULL');
    }

    try {
      await db.execute('CREATE UNIQUE INDEX idx_users_email ON users(email)');
      console.log('[Migration] ✓ Added unique index on email');
    } catch (error) {
      console.log('[Migration] Email index already exists');
    }

    // Step 4: Add additional user profile fields
    const newColumns = [
      { name: 'company', type: 'VARCHAR(255)' },
      { name: 'phone', type: 'VARCHAR(50)' },
      { name: 'country', type: 'VARCHAR(100)' },
      { name: 'industry', type: 'VARCHAR(100)' },
      { name: 'purchasingRole', type: 'VARCHAR(100)' },
      { name: 'annualPurchaseVolume', type: 'VARCHAR(100)' },
    ];

    for (const column of newColumns) {
      try {
        await db.execute(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type} NULL`);
        console.log(`[Migration] ✓ Added ${column.name} column`);
      } catch (error) {
        console.log(`[Migration] ${column.name} column already exists`);
      }
    }

    await ensureAdminAccessLoginTokenTable(db);
    await ensureInquiryNotificationEventTable(db);
    console.log('[Migration] ✓ Ensured administrator access and notification event tables');
    console.log('[Migration] ✅ Database migration completed successfully!');
  } catch {
    console.error('[Migration] Database migration failed');
    // Don't throw error - allow app to start even if migration fails
  }
}
