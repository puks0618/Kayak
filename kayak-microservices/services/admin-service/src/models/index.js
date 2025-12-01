/**
 * Models Index - Initialize Sequelize and export all models
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

// Define Administrator Model
const Administrator = sequelize.define('Administrator', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'admin_id'
  },
  firstName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'first_name',
    validate: {
      notEmpty: true
    }
  },
  lastName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'last_name',
    validate: {
      notEmpty: true
    }
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
    allowNull: true,
    validate: {
      is: /^[\d\s\-\(\)\+]+$/
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  accessLevel: {
    type: DataTypes.ENUM('super_admin', 'admin', 'support', 'analyst'),
    defaultValue: 'admin',
    field: 'access_level',
    comment: 'Defines the level of administrative access'
  },
  reportsManaged: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'reports_managed',
    comment: 'Array of report types this admin manages',
    defaultValue: []
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  }
}, {
  tableName: 'administrators',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Test database connection and sync models
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Admin Service database connection established successfully.');
    
    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✓ Admin Service database models synchronized.');
  } catch (error) {
    console.error('✗ Unable to connect to admin database:', error.message);
  }
};

initializeDatabase();

module.exports = {
  sequelize,
  Administrator
};
