import { User } from '../models/User.js';
import { logSecurityEvent } from '../models/AuditLog.js';

export const userController = {
  /**
   * Get all registered users (Staff only)
   */
  async getUsers(req, res, next) {
    try {
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();

      const formatted = users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        title: u.title || '',
        company: u.company || '',
        avatar: u.avatar,
        status: u.status,
        createdAt: u.createdAt
      }));

      return res.status(200).json(formatted);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin user provisioning
   * Only authenticated Admins can provision Agent or Admin roles
   */
  async createUserByAdmin(req, res, next) {
    try {
      const { name, email, password, role = 'Agent', title, company } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required.' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email is required.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }
      if (!['Admin', 'Agent', 'Customer'].includes(role)) {
        return res.status(400).json({ error: 'Role must be Admin, Agent, or Customer.' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ error: `An account with email "${cleanEmail}" already exists.` });
      }

      const newUser = new User({
        name: name.trim(),
        email: cleanEmail,
        password,
        role,
        title: title ? title.trim() : (role === 'Agent' ? 'Support Engineer' : role === 'Admin' ? 'Support Lead' : ''),
        company: company ? company.trim() : (role === 'Customer' ? 'Client Org' : 'SupportIQ Team'),
        status: 'Active'
      });

      await newUser.save();

      await logSecurityEvent({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'ADMIN_PROVISIONED_USER',
        resourceType: 'User',
        resourceId: newUser._id.toString(),
        ip: req.ip,
        details: { provisionedRole: role, provisionedEmail: cleanEmail }
      });

      return res.status(201).json(newUser.toJSON());
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete user by Administrator
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      if (req.user._id.toString() === id) {
        return res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
      }

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      await logSecurityEvent({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'ADMIN_DELETED_USER',
        resourceType: 'User',
        resourceId: id,
        ip: req.ip,
        details: { deletedEmail: user.email, deletedRole: user.role }
      });

      return res.status(200).json({ message: 'User removed from SupportIQ organization.' });
    } catch (err) {
      next(err);
    }
  }
};
