const { validationResult } = require('express-validator');
const authService = require('../services/AuthService');
const logger = require('../utils/logger');

// Auth controller
class AuthController {
  // Register new user
  async register(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password, first_name, last_name, role } = req.body;

      // Register user
      const result = await authService.register({
        email,
        password,
        first_name,
        last_name,
        role
      });

      logger.info('User registered', {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role
      });

      res.status(201).json({
        message: 'Registration successful',
        user: result.user.toJSON(),
        tokens: result.tokens
      });
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          error: error.message,
          code: 'EMAIL_EXISTS'
        });
      }
      
      if (error.message === 'Invalid role specified') {
        return res.status(400).json({
          error: error.message,
          code: 'INVALID_ROLE'
        });
      }

      logger.error('Registration error:', error);
      next(error);
    }
  }

  // User login
  async login(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password, rememberMe } = req.body;

      // Login user
      const result = await authService.login(email, password, rememberMe);

      logger.info('User logged in', {
        userId: result.user.id,
        email: result.user.email,
        rememberMe: !!rememberMe
      });

      res.json({
        message: 'Login successful',
        user: result.user.toJSON(),
        tokens: result.tokens
      });
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      logger.error('Login error:', error);
      next(error);
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);

      logger.info('User logged out successfully', {
        userId: req.user.id,
        email: req.user.email
      });

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async refreshToken(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { refreshToken } = req.body;

      // Refresh tokens
      const tokens = await authService.refreshToken(refreshToken);

      res.json({
        message: 'Tokens refreshed successfully',
        tokens
      });
    } catch (error) {
      if (error.message === 'Invalid refresh token') {
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      logger.error('Token refresh error:', error);
      next(error);
    }
  }

  /**
   * Get current user information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async me(req, res, next) {
    try {
      res.json({
        user: req.user.toJSON()
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      next(error);
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async forgotPassword(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email } = req.body;
      
      // Always return success to prevent email enumeration
      await authService.forgotPassword(email);

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(error);
    }
  }

  /**
   * Reset password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async resetPassword(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { token, newPassword } = req.body;

      await authService.resetPassword(token, newPassword);

      res.json({
        message: 'Password reset successfully'
      });
    } catch (error) {
      if (error.message === 'Invalid or expired reset token') {
        return res.status(400).json({
          error: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }

      logger.error('Password reset error:', error);
      next(error);
    }
  }

  /**
   * Change password for authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async changePassword(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(req.user.id, currentPassword, newPassword);

      logger.info('Password changed successfully', {
        userId: req.user.id,
        email: req.user.email
      });

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({
          error: 'Current password is incorrect',
          code: 'INCORRECT_PASSWORD'
        });
      }

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      logger.error('Change password error:', error);
      next(error);
    }
  }
}

module.exports = new AuthController();