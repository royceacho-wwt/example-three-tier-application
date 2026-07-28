/**
 * Metrics middleware for tracking request counts
 */

let requestCount = 0;

/**
 * Middleware that increments a counter for each request
 */
const requestCounter = (req, res, next) => {
  requestCount++;
  console.log(`Request count: ${requestCount}`);
  next();
};

module.exports = { requestCounter };
