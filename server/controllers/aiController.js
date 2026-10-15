import { serverAiService } from '../services/aiService.js';
import { Ticket } from '../models/Ticket.js';
import { TicketMessage } from '../models/TicketMessage.js';
import { Article } from '../models/Article.js';

export const aiController = {
  /**
   * Summarize ticket
   */
  async summarize(req, res, next) {
    try {
      const { ticketId, ticket: providedTicket } = req.body;
      let ticket = providedTicket;

      if (!ticket && ticketId) {
        ticket = await Ticket.findOne({ ticketId })
          .populate('customer', 'name email company')
          .populate('assignedTo', 'name email')
          .lean();

        if (ticket) {
          const messages = await TicketMessage.find({ ticket: ticket._id })
            .populate('author', 'name role')
            .lean();
          ticket.conversation = messages;
          ticket.requester = ticket.customer;
        }
      }

      if (!ticket) {
        return res.status(400).json({ error: 'Ticket details or ticketId required.' });
      }

      const summary = await serverAiService.summarizeTicket(ticket);
      return res.status(200).json(summary);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Suggest category
   */
  async suggestCategory(req, res, next) {
    try {
      const { ticket } = req.body;
      if (!ticket) {
        return res.status(400).json({ error: 'Ticket object is required.' });
      }
      const result = await serverAiService.suggestCategory(ticket);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Suggest priority
   */
  async suggestPriority(req, res, next) {
    try {
      const { ticket } = req.body;
      if (!ticket) {
        return res.status(400).json({ error: 'Ticket object is required.' });
      }
      const result = await serverAiService.suggestPriority(ticket);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Draft response
   */
  async draftResponse(req, res, next) {
    try {
      const { ticket, agentName } = req.body;
      if (!ticket) {
        return res.status(400).json({ error: 'Ticket object is required.' });
      }
      const result = await serverAiService.draftResponse(ticket, agentName || req.user.name);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Rephrase response tone
   */
  async rephrase(req, res, next) {
    try {
      const { text, tone } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text to rephrase is required.' });
      }
      const result = await serverAiService.rephraseResponse(text, tone);
      return res.status(200).json({ rephrased: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Generate article draft
   */
  async generateArticle(req, res, next) {
    try {
      const { title, category } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Article title is required.' });
      }
      const result = await serverAiService.generateArticle(title, category);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Deflect question via instant search
   */
  async askInstantHelp(req, res, next) {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Question query is required.' });
      }

      // Load published articles
      const articles = await Article.find({ status: 'published' }).lean();
      const result = await serverAiService.askInstantHelp(query, articles);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};
