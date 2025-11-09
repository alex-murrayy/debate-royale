const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// Auth0 middleware configuration
const jwtConfig = {
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
};

// Only add audience if it's configured (makes it optional)
if (process.env.AUTH0_AUDIENCE) {
  jwtConfig.audience = process.env.AUTH0_AUDIENCE;
}

// Auth0 middleware
const auth0Middleware = jwt(jwtConfig);

// Error handling middleware
const auth0ErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  next(err);
};

module.exports = { auth0Middleware, auth0ErrorHandler };

