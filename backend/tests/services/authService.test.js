const AuthService = require('../../src/services/AuthService');
const UserRepository = require('../../src/repositories/UserRepository');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../src/repositories/UserRepository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@library.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User',
        role: 'member'
      };

      const hashedPassword = 'hashed_password';
      const userId = 'uuid-123';
      const token = 'jwt-token';
      const refreshToken = 'refresh-token';

      UserRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue(hashedPassword);
      UserRepository.create.mockResolvedValue({
        id: userId,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role
      });
      jwt.sign.mockReturnValueOnce(token).mockReturnValueOnce(refreshToken);
      UserRepository.updateRefreshToken.mockResolvedValue();

      const result = await AuthService.register(userData);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(UserRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        max_books_allowed: 10
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', token);
      expect(result).toHaveProperty('refreshToken', refreshToken);
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@library.com',
        password: 'TestPass123!'
      };

      UserRepository.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(AuthService.register(userData))
        .rejects.toThrow('Email already registered');

      expect(UserRepository.create).not.toHaveBeenCalled();
    });

    it('should validate password requirements', async () => {
      const userData = {
        email: 'test@library.com',
        password: 'weak'
      };

      UserRepository.findByEmail.mockResolvedValue(null);

      await expect(AuthService.register(userData))
        .rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const email = 'test@library.com';
      const password = 'TestPass123!';
      const user = {
        id: 'user-123',
        email,
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        role: 'member'
      };
      const token = 'jwt-token';
      const refreshToken = 'refresh-token';

      UserRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValueOnce(token).mockReturnValueOnce(refreshToken);
      UserRepository.updateRefreshToken.mockResolvedValue();

      const result = await AuthService.login(email, password);

      expect(UserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password_hash);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', token);
      expect(result).toHaveProperty('refreshToken', refreshToken);
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw error for invalid email', async () => {
      UserRepository.findByEmail.mockResolvedValue(null);

      await expect(AuthService.login('wrong@library.com', 'password'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      const user = {
        id: 'user-123',
        email: 'test@library.com',
        password_hash: 'hashed_password'
      };

      UserRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.login('test@library.com', 'wrong'))
        .rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const userId = 'user-123';
      const user = {
        id: userId,
        email: 'test@library.com',
        refresh_token: oldRefreshToken,
        role: 'member'
      };
      const newToken = 'new-jwt-token';
      const newRefreshToken = 'new-refresh-token';

      jwt.verify.mockReturnValue({ id: userId });
      UserRepository.findById.mockResolvedValue(user);
      jwt.sign.mockReturnValueOnce(newToken).mockReturnValueOnce(newRefreshToken);
      UserRepository.updateRefreshToken.mockResolvedValue();

      const result = await AuthService.refreshToken(oldRefreshToken);

      expect(jwt.verify).toHaveBeenCalledWith(oldRefreshToken, expect.any(String));
      expect(UserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toHaveProperty('token', newToken);
      expect(result).toHaveProperty('refreshToken', newRefreshToken);
    });

    it('should throw error for invalid refresh token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(AuthService.refreshToken('invalid-token'))
        .rejects.toThrow('Invalid refresh token');
    });
  });
});