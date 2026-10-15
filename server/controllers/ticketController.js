import mongoose from 'mongoose';
import { Ticket, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../models/Ticket.js';
import { TicketMessage } from '../models/TicketMessage.js';
import { User } from '../models/User.js';
import { logSecurityEvent } from '../models/AuditLog.js';

export const ticketController = {
  /**
   * Get tickets list with role-based scoping, server-side filtering, search & pagination
   */
  async getTickets(req, res, next) {
    try {
      const {
        search,
        status,
        priority,
        category,
        assignee,
        sortBy = 'newest',
        page = 1,
        limit = 50
      } = req.query;

      const filter = {};

      // STRICT PRIVACY: Customer can ONLY query their own tickets
      if (req.user.role === 'Customer') {
        filter.customer = req.user._id;
      } else {
        // Staff filters
        if (assignee && assignee !== 'All') {
          if (assignee === 'Unassigned') {
            filter.assignedTo = null;
          } else if (mongoose.Types.ObjectId.isValid(assignee)) {
            filter.assignedTo = assignee;
          }
        }
      }

      if (status && status !== 'All') {
        filter.status = status;
      }
      if (priority && priority !== 'All') {
        filter.priority = priority;
      }
      if (category && category !== 'All') {
        filter.category = category;
      }

      if (search && search.trim()) {
        const q = search.trim();
        const searchRegex = new RegExp(q, 'i');
        filter.$or = [
          { ticketId: searchRegex },
          { subject: searchRegex },
          { description: searchRegex }
        ];
      }

      // Sorting
      let sort = { createdAt: -1 };
      if (sortBy === 'oldest') {
        sort = { createdAt: 1 };
      } else if (sortBy === 'updated') {
        sort = { updatedAt: -1 };
      } else if (sortBy === 'priority') {
        // Handled via aggregation or post-sort, default to priority descending
        sort = { priority: 1, createdAt: -1 };
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [tickets, totalCount] = await Promise.all([
        Ticket.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .populate('customer', 'name email company avatar')
          .populate('assignedTo', 'name email avatar role')
          .lean(),
        Ticket.countDocuments(filter)
      ]);

      // Transform tickets to match UI shape
      const transformed = tickets.map(t => {
        return {
          id: t.ticketId,
          _id: t._id.toString(),
          ticketId: t.ticketId,
          subject: t.subject,
          description: t.description,
          category: t.category,
          priority: t.priority,
          status: t.status,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          resolvedAt: t.resolvedAt,
          requester: t.customer ? {
            id: t.customer._id.toString(),
            name: t.customer.name,
            email: t.customer.email,
            company: t.customer.company,
            avatar: t.customer.avatar
          } : null,
          assignedTo: t.assignedTo ? {
            id: t.assignedTo._id.toString(),
            name: t.assignedTo.name,
            email: t.assignedTo.email,
            avatar: t.assignedTo.avatar,
            role: t.assignedTo.role
          } : null
        };
      });

      return res.status(200).json({
        tickets: transformed,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get single ticket by ticketId (e.g. TK-1001) or MongoDB _id
   * Enforces customer ownership and STRICT message visibility filtering at database level
   */
  async getTicketById(req, res, next) {
    try {
      const { id } = req.params;

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { ticketId: id }] }
        : { ticketId: id };

      const ticket = await Ticket.findOne(query)
        .populate('customer', 'name email company avatar role')
        .populate('assignedTo', 'name email avatar role');

      if (!ticket) {
        return res.status(404).json({ error: `Ticket ${id} not found.` });
      }

      // PRIVACY: Customer ownership check
      if (req.user.role === 'Customer') {
        if (!ticket.customer || ticket.customer._id.toString() !== req.user._id.toString()) {
          await logSecurityEvent({
            userId: req.user._id,
            userEmail: req.user.email,
            action: 'UNAUTHORIZED_TICKET_ACCESS_ATTEMPT',
            resourceType: 'Ticket',
            resourceId: ticket.ticketId,
            ip: req.ip
          });
          return res.status(403).json({
            error: 'Access denied: You do not have permission to view this ticket.'
          });
        }
      }

      // Fetch messages:
      // STRICT PRIVACY RULE: If Customer, DB query MUST exclude internal notes!
      const messageFilter = { ticket: ticket._id };
      if (req.user.role === 'Customer') {
        messageFilter.visibility = 'public'; // NEVER retrieve internal notes for customers
      }

      const messages = await TicketMessage.find(messageFilter)
        .sort({ createdAt: 1 })
        .populate('author', 'name role avatar')
        .lean();

      const formattedConversation = messages.map(m => ({
        id: m._id.toString(),
        author: {
          id: m.author?._id?.toString(),
          name: m.author?.name || 'User',
          role: m.author?.role || 'Customer',
          avatar: m.author?.avatar || ''
        },
        visibility: m.visibility,
        content: m.content,
        createdAt: m.createdAt
      }));

      const responseData = {
        id: ticket.ticketId,
        _id: ticket._id.toString(),
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt,
        requester: ticket.customer ? {
          id: ticket.customer._id.toString(),
          name: ticket.customer.name,
          email: ticket.customer.email,
          company: ticket.customer.company,
          avatar: ticket.customer.avatar
        } : null,
        assignedTo: ticket.assignedTo ? {
          id: ticket.assignedTo._id.toString(),
          name: ticket.assignedTo.name,
          email: ticket.assignedTo.email,
          avatar: ticket.assignedTo.avatar,
          role: ticket.assignedTo.role
        } : null,
        conversation: formattedConversation
      };

      return res.status(200).json(responseData);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create a new support ticket
   */
  async createTicket(req, res, next) {
    try {
      const { subject, description, category, priority, requester } = req.body;

      if (!subject || !subject.trim()) {
        return res.status(400).json({ error: 'Ticket subject is required.' });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ error: 'Ticket description is required.' });
      }
      if (!category || !TICKET_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Valid category is required (${TICKET_CATEGORIES.join(', ')}).` });
      }
      if (!priority || !TICKET_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `Valid priority is required (${TICKET_PRIORITIES.join(', ')}).` });
      }

      // Determine customer: If staff is creating on behalf of someone else, find user or use current user
      let customerId = req.user._id;
      if (req.user.role !== 'Customer' && requester && requester.email) {
        const found = await User.findOne({ email: requester.email.toLowerCase().trim() });
        if (found) {
          customerId = found._id;
        }
      }

      const ticketId = await Ticket.generateNextTicketId();

      const newTicket = new Ticket({
        ticketId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        status: 'Open',
        customer: customerId,
        assignedTo: null
      });

      await newTicket.save();

      // Create initial conversation message
      const initialMessage = new TicketMessage({
        ticket: newTicket._id,
        author: req.user._id,
        content: description.trim(),
        visibility: 'public'
      });

      await initialMessage.save();

      await logSecurityEvent({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'TICKET_CREATED',
        resourceType: 'Ticket',
        resourceId: newTicket.ticketId,
        ip: req.ip
      });

      // Populate for response
      await newTicket.populate([
        { path: 'customer', select: 'name email company avatar' },
        { path: 'assignedTo', select: 'name email avatar role' }
      ]);

      const responseData = {
        id: newTicket.ticketId,
        _id: newTicket._id.toString(),
        ticketId: newTicket.ticketId,
        subject: newTicket.subject,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
        status: newTicket.status,
        createdAt: newTicket.createdAt,
        updatedAt: newTicket.updatedAt,
        requester: {
          id: newTicket.customer._id.toString(),
          name: newTicket.customer.name,
          email: newTicket.customer.email,
          company: newTicket.customer.company,
          avatar: newTicket.customer.avatar
        },
        assignedTo: null,
        conversation: [
          {
            id: initialMessage._id.toString(),
            author: {
              id: req.user._id.toString(),
              name: req.user.name,
              role: req.user.role,
              avatar: req.user.avatar
            },
            visibility: 'public',
            content: description.trim(),
            createdAt: initialMessage.createdAt
          }
        ]
      };

      return res.status(201).json(responseData);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Add message (public reply or internal private note)
   */
  async addMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { content, visibility = 'public' } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content cannot be blank.' });
      }
      if (!['public', 'internal'].includes(visibility)) {
        return res.status(400).json({ error: 'Visibility must be either "public" or "internal".' });
      }

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { ticketId: id }] }
        : { ticketId: id };

      const ticket = await Ticket.findOne(query);
      if (!ticket) {
        return res.status(404).json({ error: `Ticket ${id} not found.` });
      }

      // PRIVACY & RBAC: Customer checks
      if (req.user.role === 'Customer') {
        if (ticket.customer.toString() !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Access denied: You do not own this ticket.' });
        }
        if (visibility === 'internal') {
          return res.status(403).json({ error: 'Forbidden: Customers cannot create internal notes.' });
        }
      }

      const message = new TicketMessage({
        ticket: ticket._id,
        author: req.user._id,
        content: content.trim(),
        visibility
      });

      await message.save();

      // State transitions
      let nextStatus = ticket.status;
      if (visibility === 'public') {
        if (req.user.role !== 'Customer' && (nextStatus === 'Open' || nextStatus === 'In Progress')) {
          nextStatus = 'Waiting for Customer';
        } else if (req.user.role === 'Customer' && nextStatus === 'Waiting for Customer') {
          nextStatus = 'In Progress';
        }
      }

      ticket.status = nextStatus;
      ticket.updatedAt = new Date();
      await ticket.save();

      // Fetch updated conversation respecting role visibility
      const messageFilter = { ticket: ticket._id };
      if (req.user.role === 'Customer') {
        messageFilter.visibility = 'public';
      }

      const messages = await TicketMessage.find(messageFilter)
        .sort({ createdAt: 1 })
        .populate('author', 'name role avatar')
        .lean();

      return res.status(200).json({
        id: ticket.ticketId,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
        conversation: messages.map(m => ({
          id: m._id.toString(),
          author: {
            id: m.author?._id?.toString(),
            name: m.author?.name || 'User',
            role: m.author?.role || 'Customer',
            avatar: m.author?.avatar || ''
          },
          visibility: m.visibility,
          content: m.content,
          createdAt: m.createdAt
        }))
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update ticket status (Staff only)
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !TICKET_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Valid status required (${TICKET_STATUSES.join(', ')}).` });
      }

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { ticketId: id }] }
        : { ticketId: id };

      const ticket = await Ticket.findOne(query);
      if (!ticket) {
        return res.status(404).json({ error: `Ticket ${id} not found.` });
      }

      ticket.status = status;
      if (status === 'Resolved') {
        ticket.resolvedAt = new Date();
      } else {
        ticket.resolvedAt = null;
      }
      ticket.updatedAt = new Date();
      await ticket.save();

      return res.status(200).json({
        id: ticket.ticketId,
        status: ticket.status,
        resolvedAt: ticket.resolvedAt,
        updatedAt: ticket.updatedAt
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update ticket priority (Staff only)
   */
  async updatePriority(req, res, next) {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      if (!priority || !TICKET_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `Valid priority required (${TICKET_PRIORITIES.join(', ')}).` });
      }

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { ticketId: id }] }
        : { ticketId: id };

      const ticket = await Ticket.findOne(query);
      if (!ticket) {
        return res.status(404).json({ error: `Ticket ${id} not found.` });
      }

      ticket.priority = priority;
      ticket.updatedAt = new Date();
      await ticket.save();

      return res.status(200).json({
        id: ticket.ticketId,
        priority: ticket.priority,
        updatedAt: ticket.updatedAt
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update ticket category (Staff only)
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { category } = req.body;

      if (!category || !TICKET_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Valid category required (${TICKET_CATEGORIES.join(', ')}).` });
      }

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { ticketId: id }] }
        : { ticketId: id };

      const ticket = await Ticket.findOne(query);
      if (!ticket) {
        return res.status(404).json({ error: `Ticket ${id} not found.` });
      }

      ticket.category = category;
      ticket.updatedAt = new Date();
      await ticket.save();

      return res.status(200).json({
        id: ticket.ticketId,
        category: ticket.category,
        updatedAt: ticket.updatedAt
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Assign ticket to an agent or unassign (Staff only)
   */
  async assignTicket(req, res, next) {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { ticketId: id }] }
        : { ticketId: id };

      const ticket = await Ticket.findOne(query);
      if (!ticket) {
        return res.status(404).json({ error: `Ticket ${id} not found.` });
      }

      if (assigneeId) {
        const agent = await User.findById(assigneeId);
        if (!agent || (agent.role !== 'Agent' && agent.role !== 'Admin')) {
          return res.status(400).json({ error: 'Assigned user must be an active Agent or Admin.' });
        }
        ticket.assignedTo = agent._id;
      } else {
        ticket.assignedTo = null;
      }

      ticket.updatedAt = new Date();
      await ticket.save();

      await ticket.populate('assignedTo', 'name email avatar role');

      return res.status(200).json({
        id: ticket.ticketId,
        assignedTo: ticket.assignedTo ? {
          id: ticket.assignedTo._id.toString(),
          name: ticket.assignedTo.name,
          email: ticket.assignedTo.email,
          avatar: ticket.assignedTo.avatar,
          role: ticket.assignedTo.role
        } : null,
        updatedAt: ticket.updatedAt
      });
    } catch (err) {
      next(err);
    }
  }
};
