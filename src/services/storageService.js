import { SEED_TICKETS, SEED_ARTICLES, DEMO_USERS } from '../data/seedData.js';

const STORAGE_KEYS = {
  TICKETS: 'supportiq_tickets_v1',
  ARTICLES: 'supportiq_articles_v1',
  CURRENT_USER: 'supportiq_current_user_v1',
  USERS: 'supportiq_users_v1',
  INITIALIZED: 'supportiq_initialized_v1'
};

class StorageService {
  /**
   * Safely parse JSON from localStorage with fallback
   */
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null || item === undefined || item === 'undefined') {
        return fallback;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn(`[StorageService] Error reading key "${key}" from localStorage, falling back to default:`, error);
      return fallback;
    }
  }

  /**
   * Safely write to localStorage
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[StorageService] Failed to set key "${key}":`, error);
      return false;
    }
  }

  /**
   * Initialize seed data only if not already present
   */
  initializeStorage(forceReset = false) {
    const isInitialized = this.get(STORAGE_KEYS.INITIALIZED, false);

    if (forceReset || !isInitialized || !this.get(STORAGE_KEYS.TICKETS) || !this.get(STORAGE_KEYS.USERS)) {
      console.log('[StorageService] Initializing SupportIQ demo data...');
      this.set(STORAGE_KEYS.TICKETS, SEED_TICKETS);
      this.set(STORAGE_KEYS.ARTICLES, SEED_ARTICLES);
      this.set(STORAGE_KEYS.USERS, DEMO_USERS);
      if (forceReset) {
        this.set(STORAGE_KEYS.CURRENT_USER, DEMO_USERS[0]);
      } else {
        if (!this.get(STORAGE_KEYS.CURRENT_USER)) {
          this.set(STORAGE_KEYS.CURRENT_USER, null);
        }
      }
      this.set(STORAGE_KEYS.INITIALIZED, true);
      return {
        tickets: SEED_TICKETS,
        articles: SEED_ARTICLES,
        users: DEMO_USERS,
        currentUser: this.getCurrentUser() || DEMO_USERS[0]
      };
    }

    return {
      tickets: this.getTickets(),
      articles: this.getArticles(),
      users: this.getUsers(),
      currentUser: this.getCurrentUser() || DEMO_USERS[0]
    };
  }

  /**
   * Reset all data back to original seed data
   */
  resetToDefaults() {
    return this.initializeStorage(true);
  }

  // --- Tickets ---
  getTickets() {
    const tickets = this.get(STORAGE_KEYS.TICKETS, null);
    if (!Array.isArray(tickets) || tickets.length === 0) {
      this.set(STORAGE_KEYS.TICKETS, SEED_TICKETS);
      return SEED_TICKETS;
    }
    return tickets;
  }

  saveTickets(tickets) {
    return this.set(STORAGE_KEYS.TICKETS, tickets);
  }

  // --- Articles ---
  getArticles() {
    const articles = this.get(STORAGE_KEYS.ARTICLES, null);
    if (!Array.isArray(articles) || articles.length === 0) {
      this.set(STORAGE_KEYS.ARTICLES, SEED_ARTICLES);
      return SEED_ARTICLES;
    }
    return articles;
  }

  saveArticles(articles) {
    return this.set(STORAGE_KEYS.ARTICLES, articles);
  }

  // --- Users List ---
  getUsers() {
    const users = this.get(STORAGE_KEYS.USERS, null);
    if (!Array.isArray(users) || users.length === 0) {
      this.set(STORAGE_KEYS.USERS, DEMO_USERS);
      return DEMO_USERS;
    }
    return users;
  }

  saveUsers(users) {
    return this.set(STORAGE_KEYS.USERS, users);
  }

  // --- Current User / Session ---
  getCurrentUser() {
    return this.get(STORAGE_KEYS.CURRENT_USER, null);
  }

  saveCurrentUser(user) {
    return this.set(STORAGE_KEYS.CURRENT_USER, user);
  }

  clearCurrentUser() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {
      console.error(e);
    }
  }
}

export const storageService = new StorageService();
