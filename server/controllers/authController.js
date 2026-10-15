import { User } from '../models/User.js';
import { signToken, getCookieOptions } from '../middleware/auth.js';
import { logSecurityEvent } from '../models/AuditLog.js';

export const authController = {
  /**
   * Register a new Customer account.
   * STRICT SECURITY RULE: Customers CANNOT register as Admin or Agent.
   * Any client-supplied 'role' field is completely discarded.
   */
  async register(req, res, next) {
    try {
      const { name, email, password, company } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Full name is required.' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email address is required.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      // Enforce Customer role unconditionally
      const newUser = new User({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: 'Customer', // HARDCODED - Prevents privilege escalation
        company: company ? company.trim() : 'Direct Customer',
        status: 'Active'
      });

      await newUser.save();

      const token = signToken(newUser);
      res.cookie('token', token, getCookieOptions());

      await logSecurityEvent({
        userId: newUser._id,
        userEmail: newUser.email,
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: newUser._id.toString(),
        ip: req.ip,
        details: { role: 'Customer' }
      });

      return res.status(201).json({
        message: 'Account created successfully.',
        user: newUser.toJSON(),
        token
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Authenticate user with email and password
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email address is required.' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Password is required.' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: cleanEmail }).select('+password');

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (user.status === 'Suspended') {
        return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      }

      const token = signToken(user);
      res.cookie('token', token, getCookieOptions());

      await logSecurityEvent({
        userId: user._id,
        userEmail: user.email,
        action: 'USER_LOGIN',
        resourceType: 'User',
        resourceId: user._id.toString(),
        ip: req.ip,
        details: { role: user.role }
      });

      return res.status(200).json({
        message: 'Logged in successfully.',
        user: user.toJSON(),
        token
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Log out current user, invalidate session cookie
   */
  async logout(req, res) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/'
    });

    if (req.user) {
      await logSecurityEvent({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'USER_LOGOUT',
        resourceType: 'User',
        resourceId: req.user._id.toString(),
        ip: req.ip
      });
    }

    return res.status(200).json({
      message: 'Logged out successfully.'
    });
  },

  /**
   * Get authenticated current user
   */
  async me(req, res) {
    return res.status(200).json({
      user: req.user.toJSON()
    });
  },

  /**
   * Initial administrator setup
   * Can only be used if NO admin exists or with matching BOOTSTRAP_SECRET
   */
  async bootstrapAdmin(req, res, next) {
    try {
      const { name, email, password, secret } = req.body;
      const expectedSecret = process.env.BOOTSTRAP_SECRET;

      const adminCount = await User.countDocuments({ role: 'Admin' });
      const secretHeader = req.headers['x-bootstrap-secret'];

      if (adminCount > 0) {
        if (!expectedSecret || (secret !== expectedSecret && secretHeader !== expectedSecret)) {
          return res.status(403).json({
            error: 'Administrator bootstrap is disabled. Admin accounts already exist.'
          });
        }
      }

      if (!name || !email || !password || password.length < 8) {
        return res.status(400).json({
          error: 'Name, email, and a password of at least 8 characters are required.'
        });
      }

      const cleanEmail = email.toLowerCase().trim();
      let adminUser = await User.findOne({ email: cleanEmail });
      if (adminUser) {
        adminUser.role = 'Admin';
        adminUser.name = name.trim();
        adminUser.password = password;
        await adminUser.save();
      } else {
        adminUser = new User({
          name: name.trim(),
          email: cleanEmail,
          password,
          role: 'Admin',
          title: 'System Administrator',
          company: 'SupportIQ Team',
          status: 'Active'
        });
        await adminUser.save();
      }

      await logSecurityEvent({
        userId: adminUser._id,
        userEmail: adminUser.email,
        action: 'ADMIN_BOOTSTRAP',
        resourceType: 'User',
        resourceId: adminUser._id.toString(),
        ip: req.ip
      });

      return res.status(201).json({
        message: 'Initial administrator successfully configured.',
        user: adminUser.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }
};
