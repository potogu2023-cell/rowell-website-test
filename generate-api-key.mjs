import crypto from 'crypto';
import mysql from 'mysql2/promise';

// Generate API Key
function generateAPIKey() {
  const randomBytes = crypto.randomBytes(16);
  const randomHex = randomBytes.toString('hex');
  return `rowell_${randomHex}`;
}

// Hash API Key
function hashAPIKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Get key prefix
function getKeyPrefix(apiKey) {
  return apiKey.substring(0, 15) + '...';
}

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get owner user ID
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE openId = ? LIMIT 1',
      [process.env.OWNER_OPEN_ID]
    );
    
    if (users.length === 0) {
      console.error('Owner user not found');
      process.exit(1);
    }
    
    const ownerId = users[0].id;
    
    // Generate API Key
    const apiKey = generateAPIKey();
    const keyHash = hashAPIKey(apiKey);
    const keyPrefix = getKeyPrefix(apiKey);
    
    // Insert into database
    await connection.execute(
      `INSERT INTO api_keys (keyHash, keyPrefix, name, description, createdBy, permissions, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        keyHash,
        keyPrefix,
        'Social Media Automation',
        'API key for automated content publishing from social media team',
        ownerId,
        'resources:create',
        1
      ]
    );
    
    console.log('✅ API Key generated successfully!');
    console.log('');
    console.log('='.repeat(80));
    console.log('API KEY (SAVE THIS - IT WILL NOT BE SHOWN AGAIN):');
    console.log('='.repeat(80));
    console.log('');
    console.log(apiKey);
    console.log('');
    console.log('='.repeat(80));
    console.log('');
    console.log('Key Details:');
    console.log(`  Name: Social Media Automation`);
    console.log(`  Prefix: ${keyPrefix}`);
    console.log(`  Permissions: resources:create`);
    console.log(`  Created By: User ID ${ownerId}`);
    console.log('');
    console.log('Usage:');
    console.log('  Authorization: Bearer ' + apiKey);
    console.log('');
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
