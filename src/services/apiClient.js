/**
 * Centralized API Client for SupportIQ
 * Uses native fetch with credentials: 'include' (HttpOnly cookie session support)
 * Handles standardized error extraction and session expiration
 */

const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    const base = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  return '/api';
};

const API_BASE = getApiBase();

class ApiClient {
  constructor() {
    this.token = null;
    this.onUnauthorized = null;
  }

  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  setOnUnauthorized(callback) {
    this.onUnauthorized = callback;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
      credentials: options.credentials || 'include'
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        const isAuthCheck = 
          endpoint.includes('/auth/login') || 
          endpoint.includes('/auth/register') || 
          endpoint.includes('/auth/me');
        if (this.onUnauthorized && !isAuthCheck) {
          const now = Date.now();
          if (!this._lastUnauthorizedTime || now - this._lastUnauthorizedTime > 4000) {
            this._lastUnauthorizedTime = now;
            this.onUnauthorized(endpoint);
          }
        }
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : null;
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Re-throw formatted errors
      if (err.status) throw err;
      // Network failure
      const networkError = new Error(err.message || 'Network request failed. Please check your connection.');
      networkError.status = 0;
      throw networkError;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
