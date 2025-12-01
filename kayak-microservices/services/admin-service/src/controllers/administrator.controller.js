/**
 * Administrator Controller
 * CRUD operations for administrator entities
 */

const { Administrator } = require('../models');
const { Op } = require('sequelize');

class AdministratorController {
  /**
   * Create a new administrator
   */
  async create(req, res) {
    try {
      const {
        firstName,
        lastName,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        accessLevel,
        reportsManaged
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['firstName', 'lastName', 'email']
        });
      }

      // Check if email already exists
      const existing = await Administrator.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const administrator = await Administrator.create({
        firstName,
        lastName,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        accessLevel: accessLevel || 'admin',
        reportsManaged: reportsManaged || []
      });

      res.status(201).json({
        message: 'Administrator created successfully',
        administrator: {
          id: administrator.id,
          firstName: administrator.firstName,
          lastName: administrator.lastName,
          email: administrator.email,
          accessLevel: administrator.accessLevel
        }
      });
    } catch (error) {
      console.error('Create administrator error:', error);
      res.status(500).json({ error: 'Failed to create administrator' });
    }
  }

  /**
   * Get all administrators with optional filters
   */
  async getAll(req, res) {
    try {
      const { accessLevel, isActive, search, page = 1, limit = 20 } = req.query;

      const where = {};
      
      if (accessLevel) {
        where.accessLevel = accessLevel;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Administrator.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['deletedAt'] }
      });

      res.json({
        administrators: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get administrators error:', error);
      res.status(500).json({ error: 'Failed to retrieve administrators' });
    }
  }

  /**
   * Get administrator by ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const administrator = await Administrator.findByPk(id);

      if (!administrator) {
        return res.status(404).json({ error: 'Administrator not found' });
      }

      res.json({ administrator });
    } catch (error) {
      console.error('Get administrator error:', error);
      res.status(500).json({ error: 'Failed to retrieve administrator' });
    }
  }

  /**
   * Update administrator
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Don't allow updating email if it conflicts
      if (updates.email) {
        const existing = await Administrator.findOne({ 
          where: { 
            email: updates.email,
            id: { [Op.ne]: id }
          } 
        });
        if (existing) {
          return res.status(409).json({ error: 'Email already in use' });
        }
      }

      const administrator = await Administrator.findByPk(id);

      if (!administrator) {
        return res.status(404).json({ error: 'Administrator not found' });
      }

      await administrator.update(updates);

      res.json({
        message: 'Administrator updated successfully',
        administrator
      });
    } catch (error) {
      console.error('Update administrator error:', error);
      res.status(500).json({ error: 'Failed to update administrator' });
    }
  }

  /**
   * Delete administrator (soft delete - deactivate)
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const administrator = await Administrator.findByPk(id);

      if (!administrator) {
        return res.status(404).json({ error: 'Administrator not found' });
      }

      // Soft delete by deactivating
      await administrator.update({ isActive: false });

      res.json({ 
        message: 'Administrator deactivated successfully' 
      });
    } catch (error) {
      console.error('Delete administrator error:', error);
      res.status(500).json({ error: 'Failed to delete administrator' });
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(req, res) {
    try {
      const { id } = req.params;

      const administrator = await Administrator.findByPk(id);

      if (!administrator) {
        return res.status(404).json({ error: 'Administrator not found' });
      }

      await administrator.update({ lastLogin: new Date() });

      res.json({ message: 'Last login updated' });
    } catch (error) {
      console.error('Update last login error:', error);
      res.status(500).json({ error: 'Failed to update last login' });
    }
  }
}

module.exports = new AdministratorController();
