// src/utils/logger.js
import fs from 'fs';
import path from 'path';

const LOG_LEVEL = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

// Ensure logs directory exists
const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'app.log');
const currentLogLevel = process.env.LOG_LEVEL || 'INFO';

/**
 * Format log message with timestamp
 */
const formatLog = (level, message, data = '') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;
  return logMessage;
};

/**
 * Write log to file and console
 */
const writeLog = (level, message, data = '') => {
  const logMessage = formatLog(level, message, data);

  // Console output
  switch (level) {
    case LOG_LEVEL.DEBUG:
      if (process.env.NODE_ENV !== 'production') console.debug(logMessage);
      break;
    case LOG_LEVEL.INFO:
      console.log(logMessage);
      break;
    case LOG_LEVEL.WARN:
      console.warn(logMessage);
      break;
    case LOG_LEVEL.ERROR:
      console.error(logMessage);
      break;
  }

  // File output
  fs.appendFile(logFile, logMessage + '\n', (err) => {
    if (err) console.error('Failed to write to log file:', err);
  });
};

export const logger = {
  debug: (message, data) => writeLog(LOG_LEVEL.DEBUG, message, data),
  info: (message, data) => writeLog(LOG_LEVEL.INFO, message, data),
  warn: (message, data) => writeLog(LOG_LEVEL.WARN, message, data),
  error: (message, data) => writeLog(LOG_LEVEL.ERROR, message, data),
};

export default logger;
