require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 5001,
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Bcrypt Configuration
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },
  
  // CORS Configuration
  cors: {
    origin: function(origin, callback) {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        process.env.FRONTEND_URL
      ].filter(Boolean);
      
      // Allow requests with no origin (like Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // limit each IP to 5 auth requests per windowMs
    }
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  
  // Business rules
  business: {
    defaultLoanPeriodDays: 14,
    maxBooksPerMember: 10
  }
};

module.exports = config;