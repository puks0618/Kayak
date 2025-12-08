const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;
const DB_CONFIG = {
  host: 'localhost',
  port: 3307,  // Docker MySQL port
  user: 'root',
  password: 'Somalwar1!',
  database: 'kayak_users'
};

function generateSSN() {
  const part1 = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const part2 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const part3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${part1}-${part2}-${part3}`;
}

async function main() {
  console.log('\n🚀 BULK ACCOUNT GENERATION\n');
  
  let connection;
  try {
    console.log('📡 Connecting to MySQL (localhost:3307)...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected\n');
    
    const hashedPassword = await bcrypt.hash('Password123', SALT_ROUNDS);
    
    console.log('📊 Creating 10,000 traveler accounts...');
    for (let batch = 0; batch < 100; batch++) {
      const values = [];
      for (let i = 0; i < 100; i++) {
        const num = batch * 100 + i + 1;
        values.push([
          uuidv4(),
          `traveller${String(num).padStart(5, '0')}@test.com`,
          hashedPassword,
          'Traveller',
          String(num).padStart(5, '0'),
          generateSSN(),
          null, null, null, null, null, null, null,
          'traveller', true, null,
          new Date(), new Date()
        ]);
      }
      
      await connection.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, ssn,
          address, city, state, zip_code, phone, profile_image_url,
          credit_card_token, role, is_active, deleted_at, created_at, updated_at) VALUES ?`,
        [values]
      );
      
      process.stdout.write(`\r  ${(batch + 1)}/100 (${Math.round(((batch + 1) / 100) * 100)}%)`);
    }
    console.log('\n✅ 10,000 traveler accounts created\n');
    
    console.log('📊 Creating 5,000 owner accounts...');
    for (let batch = 0; batch < 50; batch++) {
      const values = [];
      for (let i = 0; i < 100; i++) {
        const num = batch * 100 + i + 1;
        values.push([
          uuidv4(),
          `owner${String(num).padStart(5, '0')}@test.com`,
          hashedPassword,
          'Owner',
          String(num).padStart(5, '0'),
          generateSSN(),
          null, null, null, null, null, null, null,
          'owner', true, null,
          new Date(), new Date()
        ]);
      }
      
      await connection.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, ssn,
          address, city, state, zip_code, phone, profile_image_url,
          credit_card_token, role, is_active, deleted_at, created_at, updated_at) VALUES ?`,
        [values]
      );
      
      process.stdout.write(`\r  ${(batch + 1)}/50 (${Math.round(((batch + 1) / 50) * 100)}%)`);
    }
    console.log('\n✅ 5,000 owner accounts created\n');
    
    // Verify
    const [result] = await connection.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    console.log('📊 Final Account Summary:');
    result.forEach(row => {
      console.log(`   ${row.role}: ${row.count}`);
    });
    
    console.log('\n✅ DONE!\n');
    console.log('📝 Test Credentials:');
    console.log('   Traveller Email: traveller00001@test.com - traveller10000@test.com');
    console.log('   Owner Email:     owner00001@test.com - owner05000@test.com');
    console.log('   Password: Password123\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

main();
