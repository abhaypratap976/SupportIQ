import { apiClient } from './apiClient.js';
import { storageService } from './storageService.js';
import { getInitialsDataUri } from '../utils/avatarUtils.js';

export const ticketService = {
  /**
   * Fetch all tickets from backend API (or fallback to storage if offline)
   */
  async getAll(params = {}) {
    try {
      const data = await apiClient.get('/tickets', params);
      if (data && Array.isArray(data.tickets)) {
        return data.tickets;
      }
      if (Array.isArray(data)) {
        return data;
      }
      return storageService.getTickets();
    } catch {
      return storageService.getTickets();
    }
  },

  /**
   * Fetch a single ticket by its unique ID
   */
  async getById(id) {
    try {
      const data = await apiClient.get(`/tickets/${id}`);
      return data || null;
    } catch {
      const tickets = storageService.getTickets();
      return tickets.find(t => t.id === id || t.ticketId === id) || null;
    }
  },

  /**
   * Create a new ticket with validation and unique ID generation
   */
  async create({ subject, description, category, priority, requester, assignedTo = null }) {
    if (!subject || !subject.trim()) {
      throw new Error('Ticket subject is required.');
    }
    if (!description || !description.trim()) {
      throw new Error('Ticket description is required.');
    }
    if (!category) {
      throw new Error('Please select a category.');
    }
    if (!priority) {
      throw new Error('Please select a priority.');
    }

    try {
      const data = await apiClient.post('/tickets', {
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        requester
      });
      return data;
    } catch (err) {
      if (err.status === 0) {
        // Fallback for offline mode
        const tickets = storageService.getTickets();
        const highestNum = tickets.reduce((max, t) => {
          const match = t.id.match(/TK-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 1000);

        const newId = `TK-${highestNum + 1}`;
        const nowIso = new Date().toISOString();

        const newTicket = {
          id: newId,
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
          status: 'Open',
          requester: {
            name: requester?.name?.trim() || 'Customer',
            email: requester?.email?.trim() || 'customer@example.com',
            company: requester?.company?.trim() || 'Direct Customer',
            avatar: requester?.avatar || getInitialsDataUri(requester?.name?.trim() || 'Customer')
          },
          assignedTo: assignedTo || null,
          createdAt: nowIso,
          updatedAt: nowIso,
          conversation: [
            {
              id: `msg-${Date.now()}`,
              author: {
                name: requester?.name?.trim() || 'Customer',
                role: 'Customer',
                avatar: requester?.avatar || ''
              },
              visibility: 'public',
              content: description.trim(),
              createdAt: nowIso
            }
          ]
        };

        const updatedList = [newTicket, ...tickets];
        storageService.saveTickets(updatedList);
        return newTicket;
      }
      throw err;
    }
  },

  /**
   * Update ticket status and touch updatedAt
   */
  async updateStatus(ticketId, newStatus) {
    try {
      const data = await apiClient.patch(`/tickets/${ticketId}/status`, { status: newStatus });
      return data;
    } catch (err) {
      if (err.status === 0) {
        const tickets = storageService.getTickets();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index === -1) throw new Error(`Ticket ${ticketId} not found.`);
        const updated = {
          ...tickets[index],
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        tickets[index] = updated;
        storageService.saveTickets(tickets);
        return updated;
      }
      throw err;
    }
  },

  /**
   * Update ticket priority and touch updatedAt
   */
  async updatePriority(ticketId, newPriority) {
    try {
      const data = await apiClient.patch(`/tickets/${ticketId}/priority`, { priority: newPriority });
      return data;
    } catch (err) {
      if (err.status === 0) {
        const tickets = storageService.getTickets();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index === -1) throw new Error(`Ticket ${ticketId} not found.`);
        const updated = {
          ...tickets[index],
          priority: newPriority,
          updatedAt: new Date().toISOString()
        };
        tickets[index] = updated;
        storageService.saveTickets(tickets);
        return updated;
      }
      throw err;
    }
  },

  /**
   * Update ticket category and touch updatedAt
   */
  async updateCategory(ticketId, newCategory) {
    try {
      const data = await apiClient.patch(`/tickets/${ticketId}/category`, { category: newCategory });
      return data;
    } catch (err) {
      if (err.status === 0) {
        const tickets = storageService.getTickets();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index === -1) throw new Error(`Ticket ${ticketId} not found.`);
        const updated = {
          ...tickets[index],
          category: newCategory,
          updatedAt: new Date().toISOString()
        };
        tickets[index] = updated;
        storageService.saveTickets(tickets);
        return updated;
      }
      throw err;
    }
  },

  /**
   * Assign or reassign ticket owner
   */
  async assignTicket(ticketId, assignedUser) {
    try {
      const assigneeId = assignedUser ? (assignedUser.id || assignedUser._id) : null;
      const data = await apiClient.patch(`/tickets/${ticketId}/assign`, { assigneeId });
      return data;
    } catch (err) {
      if (err.status === 0) {
        const tickets = storageService.getTickets();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index === -1) throw new Error(`Ticket ${ticketId} not found.`);
        const updated = {
          ...tickets[index],
          assignedTo: assignedUser ? {
            id: assignedUser.id,
            name: assignedUser.name,
            email: assignedUser.email,
            avatar: assignedUser.avatar
          } : null,
          updatedAt: new Date().toISOString()
        };
        tickets[index] = updated;
        storageService.saveTickets(tickets);
        return updated;
      }
      throw err;
    }
  },

  /**
   * Add a conversation message (public reply or private internal note)
   */
  async addMessage(ticketId, { author, content, visibility = 'public' }) {
    if (!content || !content.trim()) {
      throw new Error('Message content cannot be blank.');
    }
    if (!['public', 'internal'].includes(visibility)) {
      throw new Error('Visibility must be either "public" or "internal".');
    }

    try {
      const data = await apiClient.post(`/tickets/${ticketId}/messages`, {
        content: content.trim(),
        visibility
      });
      return data;
    } catch (err) {
      if (err.status === 0) {
        const tickets = storageService.getTickets();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index === -1) throw new Error(`Ticket ${ticketId} not found.`);
        const nowIso = new Date().toISOString();
        const newMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          author: {
            name: author?.name || 'User',
            role: author?.role || 'Agent',
            avatar: author?.avatar || ''
          },
          visibility,
          content: content.trim(),
          createdAt: nowIso
        };
        let nextStatus = tickets[index].status;
        if (visibility === 'public' && author?.role !== 'Customer' && (nextStatus === 'Open' || nextStatus === 'In Progress')) {
          nextStatus = 'Waiting for Customer';
        } else if (visibility === 'public' && author?.role === 'Customer' && nextStatus === 'Waiting for Customer') {
          nextStatus = 'In Progress';
        }
        const updated = {
          ...tickets[index],
          status: nextStatus,
          updatedAt: nowIso,
          conversation: [...(tickets[index].conversation || []), newMessage]
        };
        tickets[index] = updated;
        storageService.saveTickets(tickets);
        return updated;
      }
      throw err;
    }
  },

  /**
   * Fetch backend live analytics
   */
  async fetchAnalytics() {
    try {
      const data = await apiClient.get('/analytics');
      if (data) return data;
    } catch {
      // Fallback to local calculation
    }
    return this.calculateAnalytics(storageService.getTickets());
  },

  /**
   * Calculate live analytics and summary figures from tickets array
   */
  calculateAnalytics(tickets = []) {
    const list = Array.isArray(tickets) ? tickets : [];

    // Filter unresolved
    const unresolvedTickets = list.filter(t => t.status !== 'Resolved');
    const resolvedTickets = list.filter(t => t.status === 'Resolved');
    const highPriorityTickets = unresolvedTickets.filter(t => t.priority === 'High' || t.priority === 'Urgent');
    const waitingForCustomer = list.filter(t => t.status === 'Waiting for Customer');

    // Priority breakdown
    const priorityDistribution = {
      Urgent: list.filter(t => t.priority === 'Urgent').length,
      High: list.filter(t => t.priority === 'High').length,
      Medium: list.filter(t => t.priority === 'Medium').length,
      Low: list.filter(t => t.priority === 'Low').length
    };

    // Status breakdown
    const statusDistribution = {
      Open: list.filter(t => t.status === 'Open').length,
      'In Progress': list.filter(t => t.status === 'In Progress').length,
      'Waiting for Customer': waitingForCustomer.length,
      Resolved: resolvedTickets.length
    };

    // Category breakdown
    const categoryDistribution = list.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    // Oldest unresolved tickets
    const oldestUnresolved = [...unresolvedTickets]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 5);

    // Tickets waiting for reply
    const waitingForReply = unresolvedTickets.filter(t => {
      if (t.status === 'Open') return true;
      if (!t.conversation || t.conversation.length === 0) return true;
      const lastPublicMsg = [...t.conversation].reverse().find(m => m.visibility === 'public');
      return lastPublicMsg && lastPublicMsg.author?.role === 'Customer';
    });

    // Recent tickets
    const recentTickets = [...list]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    return {
      totalTickets: list.length,
      totalOpenTickets: unresolvedTickets.length,
      highPriorityTicketsCount: highPriorityTickets.length,
      waitingForCustomerCount: waitingForCustomer.length,
      resolvedTicketsCount: resolvedTickets.length,
      priorityDistribution,
      statusDistribution,
      categoryDistribution,
      oldestUnresolved,
      waitingForReply,
      recentTickets
    };
  }
};
