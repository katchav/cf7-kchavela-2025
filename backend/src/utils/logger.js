const winston = require('winston');
const path = require('path');

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Colors for logs
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Setup colors
winston.addColors(colors);

// Pick log level
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.error ? ` - ${info.error}` : ''
    }${
      info.stack ? `\n${info.stack}` : ''
    }${
      Object.keys(info).length > 3 ? ` ${JSON.stringify(
        Object.fromEntries(
          Object.entries(info).filter(([key]) => 
            !['timestamp', 'level', 'message', 'error', 'stack'].includes(key)
          )
        ), null, 2
      )}` : ''
    }`
  )
);

// Where logs go
const transports = [
  // Console
  new winston.transports.Console({
    level: level(),
    format: format
  }),
  
  // Error file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // All logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Setup logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false
});

// Make logs folder
const fs = require('fs');
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

module.exports = logger;