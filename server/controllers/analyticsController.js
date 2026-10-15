import { Ticket } from '../models/Ticket.js';

export const analyticsController = {
  /**
   * Calculate live analytics directly from MongoDB records
   */
  async getAnalytics(req, res, next) {
    try {
      const isCustomer = req.user.role === 'Customer';
      const baseFilter = isCustomer ? { customer: req.user._id } : {};

      // 1. Fetch tickets with minimal fields
      const allTickets = await Ticket.find(baseFilter)
        .populate('customer', 'name email company avatar')
        .populate('assignedTo', 'name email avatar role')
        .sort({ createdAt: -1 })
        .lean();

      const unresolved = allTickets.filter(t => t.status !== 'Resolved');
      const resolved = allTickets.filter(t => t.status === 'Resolved');
      const waitingForCustomer = allTickets.filter(t => t.status === 'Waiting for Customer');
      const highPriority = unresolved.filter(t => t.priority === 'High' || t.priority === 'Urgent');

      // Distributions
      const priorityDistribution = {
        Urgent: allTickets.filter(t => t.priority === 'Urgent').length,
        High: allTickets.filter(t => t.priority === 'High').length,
        Medium: allTickets.filter(t => t.priority === 'Medium').length,
        Low: allTickets.filter(t => t.priority === 'Low').length
      };

      const statusDistribution = {
        Open: allTickets.filter(t => t.status === 'Open').length,
        'In Progress': allTickets.filter(t => t.status === 'In Progress').length,
        'Waiting for Customer': waitingForCustomer.length,
        Resolved: resolved.length
      };

      const categoryDistribution = allTickets.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {});

      // Oldest unresolved
      const oldestUnresolved = [...unresolved]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, 5)
        .map(t => ({
          id: t.ticketId,
          ticketId: t.ticketId,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          category: t.category,
          createdAt: t.createdAt,
          requester: t.customer ? {
            name: t.customer.name,
            email: t.customer.email,
            company: t.customer.company
          } : null,
          assignedTo: t.assignedTo ? {
            name: t.assignedTo.name
          } : null
        }));

      // Recent tickets
      const recentTickets = allTickets.slice(0, 6).map(t => ({
        id: t.ticketId,
        ticketId: t.ticketId,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        category: t.category,
        createdAt: t.createdAt,
        requester: t.customer ? {
          name: t.customer.name,
          email: t.customer.email,
          company: t.customer.company
        } : null,
        assignedTo: t.assignedTo ? {
          name: t.assignedTo.name
        } : null
      }));

      return res.status(200).json({
        totalTickets: allTickets.length,
        totalOpenTickets: unresolved.length,
        highPriorityTicketsCount: highPriority.length,
        waitingForCustomerCount: waitingForCustomer.length,
        resolvedTicketsCount: resolved.length,
        priorityDistribution,
        statusDistribution,
        categoryDistribution,
        oldestUnresolved,
        recentTickets
      });
    } catch (err) {
      next(err);
    }
  }
};
