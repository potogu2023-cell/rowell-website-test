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
      console.log('[Migration] ✓ Ensured administrator access token table');
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
    console.log('[Migration] ✓ Ensured administrator access token table');
    console.log('[Migration] ✅ Database migration completed successfully!');
  } catch (error) {
    console.error('[Migration] ❌ Migration failed:', error);
    // Don't throw error - allow app to start even if migration fails
  }
}
