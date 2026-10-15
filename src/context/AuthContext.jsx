import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService.js';
import { userService } from '../services/userService.js';
import { apiClient } from '../services/apiClient.js';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync users list from server
  const reloadUsers = useCallback(async () => {
    try {
      const allUsers = await userService.getAll();
      setUsers(allUsers);
    } catch {
      setUsers(storageService.getUsers());
    }
  }, []);

  // Verify server session on initial load
  useEffect(() => {
    let isMounted = true;
    let lastUnauthorizedToast = 0;

    async function initAuth() {
      try {
        const user = await userService.getMe();
        if (isMounted) {
          if (user) {
            setCurrentUser(user);
            storageService.saveCurrentUser(user);
            if (user.role === 'Admin' || user.role === 'Agent') {
              reloadUsers();
            }
          } else {
            // No active session
            setCurrentUser(null);
            storageService.clearCurrentUser();
          }
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
          storageService.clearCurrentUser();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Set callback for unauthorized 401s
    apiClient.setOnUnauthorized(() => {
      if (isMounted) {
        const isAuthPage = typeof window !== 'undefined' && 
          (window.location.pathname === '/login' || window.location.pathname === '/register');

        setCurrentUser((prev) => {
          const hadActiveSession = Boolean(prev);
          storageService.clearCurrentUser();

          const now = Date.now();
          if (hadActiveSession && !isAuthPage && now - lastUnauthorizedToast > 6000) {
            lastUnauthorizedToast = now;
            addToast({
              message: 'Your session has expired. Please sign in again.',
              type: 'error'
            });
          }
          return null;
        });
      }
    });

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [reloadUsers, addToast]);

  // Standard Email/Password Login
  const login = useCallback(async (email, password) => {
    try {
      const user = await userService.login(email, password);
      setCurrentUser(user);
      storageService.saveCurrentUser(user);
      if (user.role === 'Admin' || user.role === 'Agent') {
        try {
          await reloadUsers();
        } catch {
          // staff user reload non-fatal
        }
      }
      addToast({
        message: `Welcome back, ${user.name}! Logged in as ${user.role}.`,
        type: 'success'
      });
      return user;
    } catch (err) {
      addToast({
        message: err.message || 'Login failed',
        type: 'error'
      });
      throw err;
    }
  }, [reloadUsers, addToast]);

  // Demo Persona Switcher (Authenticates with real backend using demo password)
  const switchUser = useCallback(async (userId) => {
    try {
      const targetUser = users.find(u => u.id === userId || u._id === userId);
      if (targetUser && targetUser.email) {
        // Authenticate with real server using standard demo credentials
        const user = await userService.login(targetUser.email, 'password123');
        setCurrentUser(user);
        addToast({
          message: `Active persona: ${user.name} (${user.role})`,
          type: 'info'
        });
        return user;
      }
    } catch (err) {
      addToast({
        message: `Could not switch persona: ${err.message}`,
        type: 'error'
      });
    }
  }, [users, addToast]);

  // Self-Registration for Customers
  const registerCustomer = useCallback(async (userData) => {
    try {
      const newUser = await userService.registerCustomer(userData);
      setCurrentUser(newUser);
      storageService.saveCurrentUser(newUser);
      addToast({
        message: `Account created successfully! Welcome to SupportIQ, ${newUser.name}.`,
        type: 'success'
      });
      return newUser;
    } catch (err) {
      addToast({
        message: err.message || 'Registration failed',
        type: 'error'
      });
      throw err;
    }
  }, [reloadUsers, addToast]);

  // Admin user provisioning
  const createUserByAdmin = useCallback(async (userData) => {
    try {
      const newUser = await userService.createUserByAdmin(currentUser, userData);
      await reloadUsers();
      addToast({
        message: `User ${newUser.name} provisioned successfully with role [${newUser.role}].`,
        type: 'success'
      });
      return newUser;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to provision user',
        type: 'error'
      });
      throw err;
    }
  }, [currentUser, reloadUsers, addToast]);

  // Admin user deletion
  const deleteUser = useCallback(async (userId) => {
    try {
      await userService.deleteUser(currentUser, userId);
      await reloadUsers();
      addToast({
        message: 'User removed from SupportIQ organization.',
        type: 'info'
      });
      return true;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to delete user',
        type: 'error'
      });
      throw err;
    }
  }, [currentUser, reloadUsers, addToast]);

  // Genuine Logout
  const logout = useCallback(async () => {
    try {
      await userService.logout();
    } finally {
      setCurrentUser(null);
      storageService.clearCurrentUser();
      addToast({
        message: 'You have been signed out.',
        type: 'info'
      });
    }
  }, [addToast]);

  // Helper permission checks
  const isAuthenticated = Boolean(currentUser);
  const isAdmin = currentUser?.role === 'Admin';
  const isAgent = currentUser?.role === 'Agent' || currentUser?.role === 'Admin';
  const isCustomer = currentUser?.role === 'Customer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        availableUsers: users,
        loading,
        login,
        logout,
        switchUser,
        registerCustomer,
        createUserByAdmin,
        deleteUser,
        reloadUsers,
        isAdmin,
        isAgent,
        isCustomer,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
