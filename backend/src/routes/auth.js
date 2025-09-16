const express = require('express');
const authController = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/security');
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation
} = require('../validators/authValidators');

const router = express.Router();


router.post('/register', authLimiter, registerValidation, authController.register);

// Temporarily disabled auth rate limiter for testing
router.post('/login', loginValidation, authController.login);

router.post('/logout', authenticate, authController.logout);

router.post('/refresh', authLimiter, refreshTokenValidation, authController.refreshToken);

router.get('/me', authenticate, authController.me);

router.post('/forgot-password', authLimiter, forgotPasswordValidation, authController.forgotPassword);

router.post('/reset-password', authLimiter, resetPasswordValidation, authController.resetPassword);

router.post('/change-password', authenticate, changePasswordValidation, authController.changePassword);

module.exports = router;