/**
 * Example: Using MySQL Connection in User Service
 */

const { connections } = require('../../shared/database/mysql');

async function getUserById(userId) {
  const userDb = connections.users;
  await userDb.connect();
  
  const sql = 'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL';
  const users = await userDb.query(sql, [userId]);
  
  return users[0] || null;
}

async function createUser(userData) {
  const userDb = connections.users;
  await userDb.connect();
  
  const sql = `
    INSERT INTO users (id, email, password_hash, first_name, last_name, ssn, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  await userDb.query(sql, [
    userData.id,
    userData.email,
    userData.password_hash,
    userData.first_name,
    userData.last_name,
    userData.ssn,
    userData.phone
  ]);
  
  return userData;
}

module.exports = {
  getUserById,
  createUser
};
