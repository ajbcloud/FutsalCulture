import express from 'express';

const router = express.Router();

// Redirect old /api/login to the new login page
router.get('/login', (req, res) => {
  // Redirect to the login page instead of Replit OAuth
  res.redirect('/login');
});

export default router;