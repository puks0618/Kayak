/**
 * User Controller
 * CRUD operations for user management
 */

/**
 * User Controller
 * CRUD operations for user management
 */

const UserModel = require('../models/user.model');

const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const validateSSN = (ssn) => /^\d{3}-\d{2}-\d{4}$/.test(ssn);
const validateZip = (zip) => /^\d{5}(-\d{4})?$/.test(zip);

class UserController {
  // Create user (Register)
  async create(req, res) {
    try {
      const { ssn, first_name, last_name, address, city, state, zip_code, phone, email, password } = req.body;

      // Validation
      if (!validateSSN(ssn)) {
        return res.status(400).json({ error: 'Invalid SSN format. Expected ###-##-####' });
      }
      if (!validateZip(zip_code)) {
        return res.status(400).json({ error: 'Invalid Zip Code format.' });
      }
      if (!VALID_STATES.includes(state)) {
        return res.status(400).json({ error: 'Invalid US State abbreviation.' });
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Hash password (mock for now, use bcrypt in real app)
      const password_hash = password; // TODO: Hash this

      const newUser = await UserModel.create({
        ssn, first_name, last_name, address, city, state, zip_code,
        phone, email, password_hash, profile_image_url: ''
      });

      // TODO: Publish user.created event to Kafka

      res.status(201).json({
        message: 'User created successfully',
        user: { id: newUser.id, email: newUser.email }
      });
    } catch (error) {
      console.error('Create user error:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'User with this SSN or Email already exists' });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user || user.password_hash !== password) { // TODO: Use bcrypt.compare
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // TODO: Generate JWT token

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  // Get user by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      delete user.password_hash; // Don't return password
      res.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  // Update user
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate updates if present
      if (updates.ssn && !validateSSN(updates.ssn)) return res.status(400).json({ error: 'Invalid SSN' });
      if (updates.zip_code && !validateZip(updates.zip_code)) return res.status(400).json({ error: 'Invalid Zip' });
      if (updates.state && !VALID_STATES.includes(updates.state)) return res.status(400).json({ error: 'Invalid State' });

      const updatedUser = await UserModel.update(id, updates);

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // Delete user
  async delete(req, res) {
    try {
      const { id } = req.params;
      await UserModel.delete(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}

module.exports = new UserController();

