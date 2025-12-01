/**
 * User Management Controller
 * Admin operations for managing user accounts
 */

const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

class UserManagementController {
  /**
   * Get all users with filters and pagination
   */
  async getAllUsers(req, res) {
    try {
      const { role, isActive, search, page = 1, limit = 20 } = req.query;

      // Forward request to user-service
      const response = await axios.get(`${USER_SERVICE_URL}/api/users`, {
        params: { role, isActive, search, page, limit },
        headers: {
          Authorization: req.headers.authorization
        }
      });

      res.json(response.data);
    } catch (error) {
      console.error('Get all users error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to retrieve users',
        details: error.response?.data
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const response = await axios.get(`${USER_SERVICE_URL}/api/users/${id}`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });

      res.json(response.data);
    } catch (error) {
      console.error('Get user error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to retrieve user',
        details: error.response?.data
      });
    }
  }

  /**
   * Update user account
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const response = await axios.put(
        `${USER_SERVICE_URL}/api/users/${id}`,
        updates,
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.json(response.data);
    } catch (error) {
      console.error('Update user error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to update user',
        details: error.response?.data
      });
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;

      const response = await axios.patch(
        `${USER_SERVICE_URL}/api/users/${id}/deactivate`,
        {},
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.json({ 
        message: 'User deactivated successfully',
        ...response.data 
      });
    } catch (error) {
      console.error('Deactivate user error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to deactivate user',
        details: error.response?.data
      });
    }
  }

  /**
   * Activate user account
   */
  async activateUser(req, res) {
    try {
      const { id } = req.params;

      const response = await axios.patch(
        `${USER_SERVICE_URL}/api/users/${id}/activate`,
        {},
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.json({ 
        message: 'User activated successfully',
        ...response.data 
      });
    } catch (error) {
      console.error('Activate user error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to activate user',
        details: error.response?.data
      });
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['traveller', 'owner', 'admin'].includes(role)) {
        return res.status(400).json({ 
          error: 'Invalid role',
          validRoles: ['traveller', 'owner', 'admin']
        });
      }

      const response = await axios.patch(
        `${USER_SERVICE_URL}/api/users/${id}`,
        { role },
        {
          headers: {
            Authorization: req.headers.authorization
          }
        }
      );

      res.json({ 
        message: `User role changed to ${role}`,
        ...response.data 
      });
    } catch (error) {
      console.error('Change user role error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to change user role',
        details: error.response?.data
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res) {
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/api/users/stats`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });

      res.json(response.data);
    } catch (error) {
      console.error('Get user stats error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: 'Failed to retrieve user statistics',
        details: error.response?.data
      });
    }
  }
}

module.exports = new UserManagementController();
