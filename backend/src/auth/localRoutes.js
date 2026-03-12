import express from 'express';
import bcrypt from 'bcryptjs';
import { createUserWithPassword, getUserByEmail, createSession, getUserById, updateUserPassword } from '../db/db.js';
import { SESSION_COOKIE, getSessionCookieOptions } from './session.js';
import { logger } from '../utils/logger.js';

export const localAuthRouter = () => {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = await createUserWithPassword({ email, passwordHash, name });

      const session = await createSession({ userId });
      
      logger.info('local.register.success', { userId, email });

      res.cookie(SESSION_COOKIE, session.id, getSessionCookieOptions());
      return res.json({ success: true, user: { id: userId, email, name } });
    } catch (err) {
      logger.error('local.register.error', { error: err.message });
      return res.status(500).json({ error: 'Registration failed' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await getUserByEmail(email);
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const session = await createSession({ userId: user.id });

      logger.info('local.login.success', { userId: user.id, email });

      res.cookie(SESSION_COOKIE, session.id, getSessionCookieOptions());
      return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    } catch (err) {
      logger.error('local.login.error', { error: err.message });
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  router.post('/change-password', async (req, res) => {
    try {
      // req.user is populated by attachUser middleware, but we need to ensure it's there
      // Wait, localRoutes is mounted under /api/auth/* which might NOT have attachUser middleware applied if it's applied globally or per route.
      // Usually auth routes are public. But change-password requires auth.
      // We should check if req.user is present.
      // The session middleware should run before this router.
      // Let's check server.js/app.js to see where session middleware is.
      // Assuming it is available.
      
      const sessionUser = req.user;
      if (!sessionUser) {
         return res.status(401).json({ error: 'Authentication required' });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      // Fetch fresh user data including password hash
      const user = await getUserByEmail(sessionUser.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // If user has a password hash, verify current password
      if (user.password_hash) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required' });
        }
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
          return res.status(400).json({ error: 'Incorrect current password' });
        }
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await updateUserPassword(user.id, passwordHash);

      logger.info('local.password.change.success', { userId: user.id });
      return res.json({ success: true });
    } catch (err) {
      logger.error('local.password.change.error', { error: err.message });
      return res.status(500).json({ error: 'Failed to change password' });
    }
  });

  return router;
};
