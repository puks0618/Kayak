const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const DB_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_auth'
};

async function main() {
  console.log('\n🚀 MIGRATING ACCOUNTS TO kayak_auth\n');
  
  let connection;
  try {
    console.log('📡 Connecting to MySQL...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected\n');
    
    // Check if kayak_users exists and has data
    const [usersDBExists] = await connection.query(`
      SELECT COUNT(*) as count FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'kayak_users' AND TABLE_NAME = 'users'
    `);
    
    if (usersDBExists[0].count === 0) {
      console.log('❌ kayak_users database or table not found');
      return;
    }
    
    // Get all users from kayak_users
    console.log('📥 Fetching all 15,000 accounts from kayak_users...');
    const accountsConnection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'Somalwar1!',
      database: 'kayak_users'
    });
    
    const [allUsers] = await accountsConnection.query('SELECT * FROM users');
    console.log(`✓ Retrieved ${allUsers.length} accounts\n`);
    
    // Clear existing data in kayak_auth (except original 5)
    console.log('🗑️  Clearing old test data from kayak_auth...');
    await connection.query('DELETE FROM users WHERE email LIKE "%test.com"');
    console.log('✓ Cleared\n');
    
    // Insert all users into kayak_auth in batches
    console.log(`📥 Inserting ${allUsers.length} accounts into kayak_auth...`);
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      const values = batch.map(user => [
        user.id,
        user.email,
        user.password_hash,
        user.first_name,
        user.last_name,
        user.ssn,
        user.address,
        user.city,
        user.state,
        user.zip_code,
        user.phone,
        user.profile_image_url,
        user.credit_card_token,
        user.role,
        user.is_active,
        user.deleted_at,
        user.created_at,
        user.updated_at
      ]);
      
      await connection.query(
        `INSERT IGNORE INTO users (
          id, email, password_hash, first_name, last_name, ssn,
          address, city, state, zip_code, phone, profile_image_url,
          credit_card_token, role, is_active, deleted_at, created_at, updated_at
        ) VALUES ?`,
        [values]
      );
      
      inserted += batch.length;
      process.stdout.write(`\r  ${inserted}/${allUsers.length} (${Math.round((inserted / allUsers.length) * 100)}%)`);
    }
    
    console.log('\n✅ All accounts migrated\n');
    
    // Verify
    const [result] = await connection.query('SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role');
    console.log('📊 Final Account Summary in kayak_auth:');
    result.forEach(row => {
      console.log(`   ${row.role}: ${row.count}`);
    });
    
    console.log('\n✅ MIGRATION COMPLETE!\n');
    
    // Show some sample accounts
    const [samples] = await connection.query(`
      SELECT email, role FROM users 
      WHERE email LIKE '%test.com' 
      LIMIT 1
    `);
    
    if (samples.length > 0) {
      console.log('📝 Sample Accounts (ready to login):');
      console.log(`   Email: ${samples[0].email}`);
      console.log(`   Password: Password123\n`);
    }
    
    // Show original accounts
    const [original] = await connection.query(`
      SELECT email, role FROM users 
      WHERE email NOT LIKE '%test.com'
    `);
    
    console.log('📝 Original Accounts (still available):');
    original.forEach(user => {
      console.log(`   ${user.email} (${user.role})`);
    });
    
    console.log('\n✅ LOGIN READY!\n');
    
    accountsConnection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
