/**
 * Admin User Controller
 * Handles admin operations for user management
 */

const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

class AdminUserController {
  /**
   * Get all users with search filters
   * GET /api/admin/users?search=john&role=owner&isActive=true
   */
  async getAllUsers(req, res) {
    try {
      const { search, role, isActive, page = 1, limit = 20 } = req.query;
      
      const params = { page, limit };
      if (search) params.search = search;
      if (role) params.role = role;
      if (isActive !== undefined) params.isActive = isActive;

      const response = await axios.get(
        `${AUTH_SERVICE_URL}/api/auth/users`,
        {
          params,
          headers: { Authorization: req.headers.authorization }
        }
      );

      res.json({
        success: true,
        users: response.data.users || response.data,
        total: response.data.total || response.data.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Get all users error:', error.message);
      res.status(error.response?.status || 500).json({
        error: 'Failed to retrieve users',
        details: error.response?.data || error.message
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/admin/users/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const response = await axios.get(
        `${AUTH_SERVICE_URL}/api/auth/users/${id}`,
        { headers: { Authorization: req.headers.authorization } }
      );

      res.json({
        success: true,
        user: response.data.user || response.data
      });
    } catch (error) {
      console.error('Get user error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to retrieve user'
      });
    }
  }

  /**
   * Update user information
   * PUT /api/admin/users/:id
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'No update data provided'
        });
      }

      // Validate role if provided
      const validRoles = ['traveller', 'owner', 'admin', 'super_admin'];
      if (updates.role && !validRoles.includes(updates.role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be one of: ' + validRoles.join(', ')
        });
      }

      const response = await axios.put(
        `${AUTH_SERVICE_URL}/api/auth/users/${id}`,
        updates,
        {
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          }
        }
      );

      res.json({
        success: true,
        message: 'User updated successfully',
        user: response.data.user || response.data
      });
    } catch (error) {
      console.error('Update user error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to update user',
        details: error.response?.data || error.message
      });
    }
  }

  /**
   * Update user status (activate/deactivate)
   * PATCH /api/admin/users/:id/status
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          error: 'isActive must be a boolean value'
        });
      }

      const response = await axios.patch(
        `${AUTH_SERVICE_URL}/api/auth/users/${id}/status`,
        { isActive },
        {
          headers: {
            Authorization: req.headers.authorization,
            'Content-Type': 'application/json'
          }
        }
      );

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        user: response.data.user || response.data
      });
    } catch (error) {
      console.error('Update user status error:', error.message);
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(error.response?.status || 500).json({
        error: 'Failed to update user status'
      });
    }
  }
}

module.exports = new AdminUserController();
