import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { ticketService } from '../services/ticketService.js';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const TicketContext = createContext(null);

export function TicketProvider({ children }) {
  const { currentUser, isCustomer, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [serverAnalytics, setServerAnalytics] = useState(null);

  // Reload tickets from persistent backend API
  const reloadTickets = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      const [ticketList, stats] = await Promise.all([
        ticketService.getAll(),
        ticketService.fetchAnalytics()
      ]);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      if (stats) setServerAnalytics(stats);
    } catch {
      // Fallback
      setTickets(ticketService.calculateAnalytics ? [] : []);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    reloadTickets();
  }, [reloadTickets, currentUser]);

  // Filtered tickets based on active role and user filters
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    // Client-side safety filter for customer role
    if (isCustomer && currentUser?.email) {
      result = result.filter(
        (t) => t.requester?.email?.toLowerCase() === currentUser.email.toLowerCase()
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.subject?.toLowerCase().includes(q) ||
          t.id?.toLowerCase().includes(q) ||
          t.ticketId?.toLowerCase().includes(q) ||
          t.requester?.name?.toLowerCase().includes(q) ||
          t.requester?.email?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'All') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter((t) => t.category === categoryFilter);
    }

    // Assignee filter
    if (assigneeFilter !== 'All' && !isCustomer) {
      if (assigneeFilter === 'Unassigned') {
        result = result.filter((t) => !t.assignedTo);
      } else {
        result = result.filter((t) => t.assignedTo?.id === assigneeFilter || t.assignedTo?._id === assigneeFilter);
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'updated') {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      if (sortBy === 'priority') {
        const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      return 0;
    });

    return result;
  }, [tickets, isCustomer, currentUser?.email, searchQuery, statusFilter, priorityFilter, categoryFilter, assigneeFilter, sortBy]);

  // Live analytics
  const analytics = useMemo(() => {
    if (serverAnalytics) return serverAnalytics;
    return ticketService.calculateAnalytics(tickets);
  }, [serverAnalytics, tickets]);

  // Actions
  const createTicket = useCallback(async (ticketData) => {
    try {
      const newTicket = await ticketService.create(ticketData);
      await reloadTickets();
      addToast({
        message: `Ticket ${newTicket.id || newTicket.ticketId} created successfully.`,
        type: 'success'
      });
      return newTicket;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to create ticket',
        type: 'error'
      });
      throw err;
    }
  }, [reloadTickets, addToast]);

  const updateStatus = useCallback(async (ticketId, newStatus) => {
    try {
      const updated = await ticketService.updateStatus(ticketId, newStatus);
      await reloadTickets();
      addToast({
        message: `Ticket status updated to "${newStatus}"`,
        type: 'success'
      });
      return updated;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to update status',
        type: 'error'
      });
      throw err;
    }
  }, [reloadTickets, addToast]);

  const updatePriority = useCallback(async (ticketId, newPriority) => {
    try {
      const updated = await ticketService.updatePriority(ticketId, newPriority);
      await reloadTickets();
      addToast({
        message: `Ticket priority updated to "${newPriority}"`,
        type: 'success'
      });
      return updated;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to update priority',
        type: 'error'
      });
      throw err;
    }
  }, [reloadTickets, addToast]);

  const updateCategory = useCallback(async (ticketId, newCategory) => {
    try {
      const updated = await ticketService.updateCategory(ticketId, newCategory);
      await reloadTickets();
      addToast({
        message: `Category updated to "${newCategory}"`,
        type: 'success'
      });
      return updated;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to update category',
        type: 'error'
      });
      throw err;
    }
  }, [reloadTickets, addToast]);

  const assignTicket = useCallback(async (ticketId, assignedUser) => {
    try {
      const updated = await ticketService.assignTicket(ticketId, assignedUser);
      await reloadTickets();
      addToast({
        message: assignedUser ? `Assigned to ${assignedUser.name}` : 'Ticket unassigned',
        type: 'info'
      });
      return updated;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to reassign ticket',
        type: 'error'
      });
      throw err;
    }
  }, [reloadTickets, addToast]);

  const addMessage = useCallback(async (ticketId, { content, visibility }) => {
    try {
      const author = {
        name: currentUser?.name || 'User',
        role: currentUser?.role || 'Customer',
        avatar: currentUser?.avatar || ''
      };

      const updated = await ticketService.addMessage(ticketId, {
        author,
        content,
        visibility
      });
      await reloadTickets();
      addToast({
        message: visibility === 'internal' ? 'Private internal note saved' : 'Public reply sent to customer',
        type: 'success'
      });
      return updated;
    } catch (err) {
      addToast({
        message: err.message || 'Failed to add message',
        type: 'error'
      });
      throw err;
    }
  }, [currentUser, reloadTickets, addToast]);

  const getTicketById = useCallback((id) => {
    const rawTicket = tickets.find(t => t.id === id || t.ticketId === id);
    if (!rawTicket) return null;

    if (isCustomer && currentUser?.email) {
      if (rawTicket.requester?.email?.toLowerCase() !== currentUser.email.toLowerCase()) {
        return null;
      }
    }
    return rawTicket;
  }, [tickets, isCustomer, currentUser?.email]);

  return (
    <TicketContext.Provider
      value={{
        tickets,
        filteredTickets,
        loading,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        categoryFilter,
        setCategoryFilter,
        assigneeFilter,
        setAssigneeFilter,
        sortBy,
        setSortBy,
        analytics,
        createTicket,
        updateStatus,
        updatePriority,
        updateCategory,
        assignTicket,
        addMessage,
        getTicketById,
        reloadTickets
      }}
    >
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
}
