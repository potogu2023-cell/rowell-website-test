/**
 * Script to create an admin user
 * Usage: pnpm tsx scripts/create-admin.ts
 */

import { getDb } from '../server/db';
import { users } from '../drizzle/schema';
import { hashPassword } from '../server/auth-utils';
import { eq } from 'drizzle-orm';

async function createAdmin() {
  const adminEmail = 'admin@rowellhplc.com';
  const adminPassword = 'admin123456'; // Change this in production!
  
  console.log('Creating admin user...');
  
  // Get database instance
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }
  
  // Check if admin already exists
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);
  
  if (existingAdmin.length > 0) {
    console.log('Admin user already exists:', adminEmail);
    console.log('User ID:', existingAdmin[0].id);
    console.log('Role:', existingAdmin[0].role);
    return;
  }
  
  // Hash password
  const hashedPassword = await hashPassword(adminPassword);
  
  // Create admin user
  const result = await db.insert(users).values({
    openId: `admin:${adminEmail}`,
    email: adminEmail,
    password: hashedPassword,
    name: 'Oscar (Admin)',
    role: 'admin',
    loginMethod: 'email',
    emailVerified: 1,
    company: 'ROWELL HPLC',
    phone: '+86 21 12345678',
    country: 'China',
  });
  
  console.log('✅ Admin user created successfully!');
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);
  console.log('⚠️  Please change the password after first login!');
  
  process.exit(0);
}

createAdmin().catch((error) => {
  console.error('Failed to create admin user:', error);
  process.exit(1);
});

