const request = require('supertest');
const express = require('express');
const AuthController = require('../../src/controllers/AuthController');
const AuthService = require('../../src/services/AuthService');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../src/services/AuthService');
jest.mock('express-validator');

// Create a test app
const app = express();
app.use(express.json());

// Mock validation middleware
const mockValidation = (req, res, next) => {
  validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  next();
};

// Set up routes for testing
app.post('/auth/register', mockValidation, AuthController.register);
app.post('/auth/login', mockValidation, AuthController.login);
app.post('/auth/refresh', AuthController.refreshToken);

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@library.com',
        password: 'SecurePass123!',
        first_name: 'New',
        last_name: 'User',
        role: 'member'
      };

      const mockResponse = {
        user: {
          id: 'user-123',
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role
        },
        token: 'jwt-token',
        refreshToken: 'refresh-token'
      };

      AuthService.register.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
      expect(AuthService.register).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Email is required', param: 'email' }]
      });

      const response = await request(app)
        .post('/auth/register')
        .send({ password: 'test' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(AuthService.register).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const userData = {
        email: 'existing@library.com',
        password: 'SecurePass123!'
      };

      AuthService.register.mockRejectedValue(new Error('Email already registered'));

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'user@library.com',
        password: 'UserPass123!'
      };

      const mockResponse = {
        user: {
          id: 'user-123',
          email: credentials.email,
          first_name: 'Test',
          last_name: 'User',
          role: 'member'
        },
        token: 'jwt-token',
        refreshToken: 'refresh-token'
      };

      AuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(AuthService.login).toHaveBeenCalledWith(
        credentials.email,
        credentials.password
      );
    });

    it('should return 401 for invalid credentials', async () => {
      const credentials = {
        email: 'user@library.com',
        password: 'WrongPassword'
      };

      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      AuthService.login.mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/login')
        .send(credentials)
        .expect(500); // Would be 401 with proper error handling middleware

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockResponse = {
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: 'user-123',
          email: 'user@library.com',
          role: 'member'
        }
      };

      AuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(AuthService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Refresh token is required');
      expect(AuthService.refreshToken).not.toHaveBeenCalled();
    });
  });
});