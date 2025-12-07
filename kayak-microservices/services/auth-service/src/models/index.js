/**
 * Models Index
 * Export all database models
 */

const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

// Define User Model (aligned with rubric requirements)
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ssn: {
    type: DataTypes.STRING(11),
    allowNull: false,
    unique: true,
    comment: 'User ID in SSN format: ###-##-####',
    validate: {
      is: /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/,
      notEmpty: true
    }
  },
  firstName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'last_name'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.CHAR(2),
    allowNull: true,
    comment: 'US State abbreviation',
    validate: {
      is: /^[A-Z]{2}$/i
    }
  },
  zipCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'zip_code',
    comment: 'Format: ##### or #####-####',
    validate: {
      is: /^[0-9]{5}(-[0-9]{4})?$/
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  profileImage: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'profile_image_url'
  },
  creditCardToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'credit_card_token',
    comment: 'Mock token for payment details'
  },
  role: {
    type: DataTypes.ENUM('traveller', 'owner', 'admin'),
    defaultValue: 'traveller'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: false // We're handling soft deletes manually with deletedAt
});

// Test database connection
sequelize.authenticate()
  .then(() => console.log('Database connection established successfully.'))
  .catch(err => console.error('Unable to connect to database:', err));

// Sync models (create tables if they don't exist)
sequelize.sync({ alter: false })
  .then(() => console.log('Database models synchronized.'))
  .catch(err => console.error('Error synchronizing models:', err));

module.exports = {
  sequelize,
  User
};

