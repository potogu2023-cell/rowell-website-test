import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertProduct, InsertUser, products, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  console.log('[Database] getDb() called. _db exists:', !!_db, 'DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL
      let connectionString = process.env.DATABASE_URL;
      console.log('[Database] Original DATABASE_URL:', connectionString);
      
      // Check if URL has ssl parameter and remove it
      const hasSSL = connectionString.includes('?ssl=');
      connectionString = connectionString.replace(/\?ssl=true/, '').replace(/\?ssl=false/, '');
      console.log('[Database] After removing SSL param:', connectionString);
      console.log('[Database] Has SSL:', hasSSL);
      
      // Parse the connection URL
      // Format: mysql://username:password@host:port/database
      const urlMatch = connectionString.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      console.log('[Database] URL match result:', urlMatch ? 'SUCCESS' : 'FAILED');
      
      if (!urlMatch) {
        console.error('[Database] Failed to parse DATABASE_URL. Expected format: mysql://username:password@host:port/database');
        throw new Error('Invalid DATABASE_URL format');
      }
      
      const [, user, password, host, port, database] = urlMatch;
      
      // Decode URL-encoded username and password
      const decodedUser = decodeURIComponent(user);
      const decodedPassword = decodeURIComponent(password);
      
      console.log('[Database] Parsed connection info:');
      console.log('[Database]   Host:', host);
      console.log('[Database]   Port:', port);
      console.log('[Database]   User:', decodedUser);
      console.log('[Database]   Database:', database);
      console.log('[Database]   SSL:', hasSSL);
      
      // Create connection pool with proper config
      const connection = mysql.createPool({
        host,
        port: parseInt(port),
        user: decodedUser,
        password: decodedPassword,
        database,
        ssl: hasSSL ? {
          rejectUnauthorized: true
        } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      
      console.log('[Database] Connection pool created');
      
      // Test the connection
      try {
        const testConnection = await connection.getConnection();
        console.log('[Database] Test connection successful');
        testConnection.release();
      } catch (testError: any) {
        console.error('[Database] Test connection failed:', testError.message);
        throw testError;
      }
      
      _db = drizzle(connection);
      console.log('[Database] Drizzle instance created successfully');
    } catch (error: any) {
      console.error('[Database] Failed to initialize database:', error.message);
      console.error('[Database] Error stack:', error.stack);
      throw error;
    }
  }
  
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      handle: user.handle,
      username: user.username,
      avatarUrl: user.avatarUrl,
      email: user.email,
    };

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          username: user.username,
          avatarUrl: user.avatarUrl,
          email: user.email,
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(handle: string) {
  const db = await getDb();
  
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db.select().from(users).where(eq(users.handle, handle));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    return null;
  }
}

export async function getAllUsers() {
  const db = await getDb();
  
  if (!db) {
    console.warn("[Database] Cannot get all users: database not available");
    return [];
  }

  try {
    return await db.select().from(users);
  } catch (error) {
    console.error("[Database] Failed to get all users:", error);
    return [];
  }
}
