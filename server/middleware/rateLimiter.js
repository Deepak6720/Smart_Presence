const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP. Please try again in 15 minutes.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.'
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'AI request limit reached. Please try again in an hour.'
  }
});

module.exports = { generalLimiter, authLimiter, aiLimiter };