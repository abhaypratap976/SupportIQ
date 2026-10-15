// Centralized User & Identity Management Service
// Enforces role-based security rules and persistent backend API integration
import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';
import { getInitialsDataUri } from '../utils/avatarUtils.js';

export const userService = {
  /**
   * Retrieve all registered users from backend API (or fallback to storage if offline)
   */
  async getAll() {
    try {
      const data = await apiClient.get('/users');
      return Array.isArray(data) ? data : [];
    } catch {
      return storageService.getUsers();
    }
  },

  /**
   * Find user by ID
   */
  async getById(id) {
    const users = await this.getAll();
    return users.find(u => u.id === id || u._id === id) || null;
  },

  /**
   * Find user by email
   */
  async getByEmail(email) {
    const users = await this.getAll();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  /**
   * Check currently authenticated session via /api/auth/me
   */
  async getMe() {
    try {
      const data = await apiClient.get('/auth/me');
      if (data && data.user) {
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Authenticate a user with email and password via real backend
   */
  async login(email, password) {
    if (!email || !email.trim()) throw new Error('Email address is required.');
    if (!password) throw new Error('Password is required.');

    const cleanEmail = email.toLowerCase().trim();

    try {
      const res = await apiClient.post('/auth/login', {
        email: cleanEmail,
        password
      });

      if (res && res.token) {
        apiClient.setToken(res.token);
      }

      if (res && res.user) {
        // Cache user profile for session resumption
        storageService.saveCurrentUser(res.user);
        return res.user;
      }
      throw new Error('Invalid response from authentication server.');
    } catch (err) {
      // If server is not responding at all (network error status 0), allow offline demo mode fallback
      if (err.status === 0) {
        const user = storageService.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
        if (user && (!user.password || user.password === password)) {
          storageService.saveCurrentUser(user);
          return user;
        }
      }
      throw err;
    }
  },

  /**
   * Genuine logout: invalidates server session cookie and clears local storage
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('[userService] Logout request error (clearing local session anyway):', e.message);
    } finally {
      apiClient.clearToken();
      storageService.clearCurrentUser();
    }
    return true;
  },

  /**
   * Self-registration for Customers.
   * STRICT SECURITY RULE: Customers CANNOT create Admin or Agent accounts!
   */
  async registerCustomer({ name, email, password, company }) {
    if (!name || !name.trim()) throw new Error('Full name is required.');
    if (!email || !email.trim()) throw new Error('Email address is required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      const res = await apiClient.post('/auth/register', {
        name: name.trim(),
        email: cleanEmail,
        password,
        company: company?.trim()
      });

      if (res && res.token) {
        apiClient.setToken(res.token);
      }

      if (res && res.user) {
        storageService.saveCurrentUser(res.user);
        return res.user;
      }
      throw new Error('Unexpected registration response.');
    } catch (err) {
      if (err.status === 0) {
        // Fallback for offline mode
        const existing = storageService.getUsers().find(u => u.email.toLowerCase() === cleanEmail);
        if (existing) {
          throw new Error(`An account with email "${cleanEmail}" already exists.`);
        }
        const newUser = {
          id: `cust-${Date.now().toString(36)}`,
          name: name.trim(),
          email: cleanEmail,
          password,
          role: 'Customer',
          company: company?.trim() || 'Direct Customer',
          avatar: getInitialsDataUri(name.trim()),
          createdAt: new Date().toISOString()
        };
        const users = storageService.getUsers();
        storageService.saveUsers([...users, newUser]);
        storageService.saveCurrentUser(newUser);
        return newUser;
      }
      throw err;
    }
  },

  /**
   * Provision a new user by an Administrator.
   * Only authenticated Admins can provision Agent or Admin roles!
   */
  async createUserByAdmin(callerUser, { name, email, password, role = 'Agent', title, company }) {
    if (!callerUser || callerUser.role !== 'Admin') {
      throw new Error('Access Denied: Only administrators have permission to provision staff or customer accounts.');
    }

    if (!name || !name.trim()) throw new Error('Name is required.');
    if (!email || !email.trim()) throw new Error('Email is required.');
    if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');
    if (!['Admin', 'Agent', 'Customer'].includes(role)) {
      throw new Error('Invalid role specified. Must be Admin, Agent, or Customer.');
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      const res = await apiClient.post('/users', {
        name: name.trim(),
        email: cleanEmail,
        password,
        role,
        title: title?.trim(),
        company: company?.trim()
      });
      return res;
    } catch (err) {
      if (err.status === 0) {
        const users = storageService.getUsers();
        const prefix = role === 'Customer' ? 'cust' : 'user';
        const newUser = {
          id: `${prefix}-${Date.now().toString(36)}`,
          name: name.trim(),
          email: cleanEmail,
          password,
          role,
          title: title?.trim() || '',
          company: company?.trim() || 'SupportIQ Team',
          avatar: getInitialsDataUri(name.trim()),
          createdAt: new Date().toISOString()
        };
        storageService.saveUsers([...users, newUser]);
        return newUser;
      }
      throw err;
    }
  },

  /**
   * Delete user by Administrator
   */
  async deleteUser(callerUser, userId) {
    if (!callerUser || callerUser.role !== 'Admin') {
      throw new Error('Access Denied: Only administrators can delete user accounts.');
    }
    if (callerUser.id === userId || callerUser._id === userId) {
      throw new Error('You cannot delete your own active administrator account.');
    }

    try {
      await apiClient.delete(`/users/${userId}`);
      return true;
    } catch (err) {
      if (err.status === 0) {
        const users = storageService.getUsers().filter(u => u.id !== userId && u._id !== userId);
        storageService.saveUsers(users);
        return true;
      }
      throw err;
    }
  }
};
