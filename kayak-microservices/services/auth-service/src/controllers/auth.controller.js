/**
 * Auth Controller
 * Handles authentication operations
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const SALT_ROUNDS = 10;

// Helper to generate a synthetic SSN-style ID (for project rubric)
async function generateUniqueSSN() {
  // Keep trying until we find an unused SSN
  // Pattern: ###-##-####
  const generateOnce = () => {
    const rand = (n) => Math.floor(Math.random() * n);
    const part1 = String(100 + rand(900));   // 100-999
    const part2 = String(10 + rand(90));     // 10-99
    const part3 = String(1000 + rand(9000)); // 1000-9999
    return `${part1}-${part2}-${part3}`;
  };

  // Try a few times; collision probability is tiny for project scale
  for (let i = 0; i < 5; i++) {
    const candidate = generateOnce();
    const existing = await User.findOne({ where: { ssn: candidate } });
    if (!existing) return candidate;
  }
  // Fallback (extremely unlikely)
  return generateOnce();
}

// Validation helper functions (outside class to avoid binding issues)
function validateSSN(ssn) {
  const ssnPattern = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;
  return ssnPattern.test(ssn);
}

function validateZipCode(zipCode) {
  if (!zipCode) return true; // Optional field
  const zipPattern = /^[0-9]{5}(-[0-9]{4})?$/;
  return zipPattern.test(zipCode);
}

function validateState(state) {
  if (!state) return true; // Optional field
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  return validStates.includes(state.toUpperCase());
}

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        ssn, // optional – if not provided we generate one
        address,
        city,
        state,
        zipCode,
        phone,
        profileImage,
        creditCardToken,
        role // optional - defaults to 'traveller' if not provided
      } = req.body;

      // Validate required fields (SSN is NOT required from the UI)
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          error: 'Email, password, first name, and last name are required' 
        });
      }

      // Validate role if provided
      if (role && !['traveller', 'owner', 'admin'].includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role. Must be traveller, owner, or admin' 
        });
      }

      let finalSSN = ssn;

      // If SSN provided, validate format; otherwise generate one
      if (finalSSN) {
        if (!validateSSN(finalSSN)) {
          return res.status(400).json({ 
            error: 'Invalid SSN format. Must be ###-##-####' 
          });
        }
      } else {
        finalSSN = await generateUniqueSSN();
      }

      // Validate state if provided
      if (state && !validateState(state)) {
        return res.status(400).json({ 
          error: 'Invalid state abbreviation. Must be a valid US state code.' 
        });
      }

      // Validate ZIP code if provided
      if (zipCode && !validateZipCode(zipCode)) {
        return res.status(400).json({ 
          error: 'Invalid ZIP code format. Must be ##### or #####-####' 
        });
      }

      const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (!strongPasswordPattern.test(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters and include at least one number' 
        });
      }

      // Check if user already exists (by email or SSN)
      const existingUser = await User.findOne({ 
        where: { 
          [require('sequelize').Op.or]: [
            { email },
            { ssn: finalSSN }
          ]
        } 
      });
      
      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(409).json({ error: 'Email already registered' });
        }
        if (existingUser.ssn === finalSSN) {
          return res.status(409).json({ error: 'SSN already registered' });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user in database
      const newUser = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        ssn: finalSSN,
        address: address || null,
        city: city || null,
        state: state ? state.toUpperCase() : null,
        zipCode: zipCode || null,
        phone: phone || null,
        profileImage: profileImage || null,
        creditCardToken: creditCardToken || null,
        role: role || 'traveller' // default to 'traveller' if not specified
      });

      // TODO: Publish user.created event to Kafka

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser.id, 
          ssn: newUser.ssn,
          email: newUser.email,
          role: newUser.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          ssn: newUser.ssn,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          address: newUser.address,
          city: newUser.city,
          state: newUser.state,
          zipCode: newUser.zipCode,
          phone: newUser.phone,
          profileImage: newUser.profileImage,
          role: newUser.role
        },
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      
      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.errors.map(e => e.message)
        });
      }
      
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user by email
      const user = await User.findOne({ where: { email, deletedAt: null } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          ssn: user.ssn,
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      res.json({
        token,
        user: {
          id: user.id,
          ssn: user.ssn,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Get user information
  async getUserInfo(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware

      const user = await User.findOne({ 
        where: { id: userId, deletedAt: null } 
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          ssn: user.ssn,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          phone: user.phone,
          profileImage: user.profileImage,
          creditCardToken: user.creditCardToken ? '****' : null, // Mask sensitive data
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error('Get user info error:', error);
      res.status(500).json({ error: 'Failed to retrieve user information' });
    }
  }

  // Update user information
  async updateUser(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware
      const {
        firstName,
        lastName,
        address,
        city,
        state,
        zipCode,
        phone,
        profileImage,
        creditCardToken
      } = req.body;

      // Validate state if provided
      if (state && !this.validateState(state)) {
        return res.status(400).json({ 
          error: 'Invalid state abbreviation. Must be a valid US state code.' 
        });
      }

      // Validate ZIP code if provided
      if (zipCode && !this.validateZipCode(zipCode)) {
        return res.status(400).json({ 
          error: 'Invalid ZIP code format. Must be ##### or #####-####' 
        });
      }

      const user = await User.findOne({ 
        where: { id: userId, deletedAt: null } 
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update only provided fields
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (address !== undefined) updateData.address = address;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state ? state.toUpperCase() : null;
      if (zipCode !== undefined) updateData.zipCode = zipCode;
      if (phone !== undefined) updateData.phone = phone;
      if (profileImage !== undefined) updateData.profileImage = profileImage;
      if (creditCardToken !== undefined) updateData.creditCardToken = creditCardToken;

      await user.update(updateData);

      // TODO: Publish user.updated event to Kafka

      res.json({
        message: 'User updated successfully',
        user: {
          id: user.id,
          ssn: user.ssn,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // Delete user (soft delete)
  async deleteUser(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware

      const user = await User.findOne({ 
        where: { id: userId, deletedAt: null } 
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Soft delete by setting deletedAt timestamp
      await user.update({ 
        deletedAt: new Date(),
        isActive: false 
      });

      // TODO: Publish user.deleted event to Kafka

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  // Verify token
  async verify(req, res) {
    try {
      const { token } = req.body;

      const decoded = jwt.verify(token, JWT_SECRET);

      res.json({
        valid: true,
        user: decoded
      });
    } catch (error) {
      res.status(401).json({
        valid: false,
        error: 'Invalid token'
      });
    }
  }

  // Refresh token
  async refresh(req, res) {
    try {
      // TODO: Implement refresh token logic
      res.json({ message: 'Token refreshed' });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }
}

module.exports = new AuthController();

