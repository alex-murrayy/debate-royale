const express = require('express');
const router = express.Router();

// Auth0 handles authentication, this route is just for health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auth0 authentication enabled' });
});

module.exports = router;
