// AI Assistance Service (Configured backend proxy with honest local heuristic fallback)
import { apiClient } from './apiClient.js';

export const aiService = {
  isMock: true,
  providerName: 'SupportIQ Heuristic Rule Engine (Local)',

  async summarizeTicket(ticket) {
    try {
      const data = await apiClient.post('/ai/summarize', { ticket });
      if (data) return data;
    } catch {
      // Local heuristic fallback
    }

    const messageCount = ticket.conversation ? ticket.conversation.length : 1;
    const internalNotesCount = (ticket.conversation || []).filter(m => m.visibility === 'internal').length;
    const requesterName = ticket.requester?.name || 'The customer';
    const company = ticket.requester?.company ? ` (${ticket.requester.company})` : '';

    let mainPoint = ticket.description || '';
    if (mainPoint.length > 200) {
      mainPoint = mainPoint.substring(0, 197) + '...';
    }

    return {
      executiveSummary: `${requesterName}${company} reported an issue regarding "${ticket.subject}". Current status is ${ticket.status} with ${ticket.priority} priority.`,
      keyPoints: [
        `Core Issue: ${mainPoint}`,
        `Current Triage: Assigned to ${ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'} | Category: ${ticket.category}`,
        `Timeline Activity: ${messageCount} total messages recorded (${internalNotesCount} internal team notes)`
      ],
      nextAction: ticket.status === 'Resolved' 
        ? 'Ticket is resolved. No further action needed unless customer reopens.' 
        : ticket.status === 'Waiting for Customer'
        ? 'Awaiting customer response to previous instructions.'
        : 'Support agent review and response required.',
      isRuleBased: true,
      provider: 'SupportIQ Heuristic Rule Engine (Local)'
    };
  },

  async suggestCategory(ticket) {
    try {
      const data = await apiClient.post('/ai/suggest-category', { ticket });
      if (data) return data;
    } catch {
      // Fallback
    }

    const text = `${ticket.subject || ''} ${ticket.description || ''}`.toLowerCase();
    let recommendedCategory = 'General Inquiry';
    let rationale = 'General inquiry detected based on overall ticket context.';
    let confidence = 78;

    if (text.includes('504') || text.includes('timeout') || text.includes('api') || text.includes('webhook') || text.includes('error') || text.includes('bug') || text.includes('server') || text.includes('cname') || text.includes('dns') || text.includes('dkim')) {
      recommendedCategory = 'Technical Issue';
      rationale = 'Identified technical error patterns (API/DNS/protocol/timeout keywords).';
      confidence = 94;
    } else if (text.includes('invoice') || text.includes('charge') || text.includes('bill') || text.includes('refund') || text.includes('credit') || text.includes('payment') || text.includes('seat')) {
      recommendedCategory = 'Billing';
      rationale = 'Detected billing and payment related terms (charge, invoice, seat expansion).';
      confidence = 96;
    } else if (text.includes('mfa') || text.includes('login') || text.includes('password') || text.includes('locked') || text.includes('auth') || text.includes('2fa') || text.includes('access')) {
      recommendedCategory = 'Account Access';
      rationale = 'Detected authentication and credential recovery requirements.';
      confidence = 95;
    } else if (text.includes('feature') || text.includes('csv') || text.includes('export') || text.includes('roadmap') || text.includes('integration') || text.includes('request')) {
      recommendedCategory = 'Feature Request';
      rationale = 'Customer is requesting additional functionality or product capabilities.';
      confidence = 91;
    }

    return {
      suggestedCategory: recommendedCategory,
      currentCategory: ticket.category,
      isMatch: recommendedCategory === ticket.category,
      rationale,
      confidence,
      isRuleBased: true,
      provider: 'SupportIQ Heuristic Rule Engine (Local)'
    };
  },

  async suggestPriority(ticket) {
    try {
      const data = await apiClient.post('/ai/suggest-priority', { ticket });
      if (data) return data;
    } catch {
      // Fallback
    }

    const text = `${ticket.subject || ''} ${ticket.description || ''}`.toLowerCase();
    let recommendedPriority = 'Medium';
    let rationale = 'Standard priority for routine questions or inquiries.';
    let confidence = 82;

    if (text.includes('down') || text.includes('production') || text.includes('outage') || text.includes('504') || text.includes('critical') || text.includes('urgent') || text.includes('blocker')) {
      recommendedPriority = 'Urgent';
      rationale = 'Critical severity keywords detected indicating system downtime or urgent blocker.';
      confidence = 97;
    } else if (text.includes('broken') || text.includes('fail') || text.includes('cannot login') || text.includes('locked out') || text.includes('security') || text.includes('vulnerability')) {
      recommendedPriority = 'High';
      rationale = 'High impact operational issue detected impacting access or security.';
      confidence = 92;
    } else if (text.includes('how to') || text.includes('question') || text.includes('when') || text.includes('minor') || text.includes('typo')) {
      recommendedPriority = 'Low';
      rationale = 'Informational inquiry or minor cosmetic issue.';
      confidence = 88;
    }

    return {
      suggestedPriority: recommendedPriority,
      currentPriority: ticket.priority,
      isMatch: recommendedPriority === ticket.priority,
      rationale,
      confidence,
      isRuleBased: true,
      provider: 'SupportIQ Heuristic Rule Engine (Local)'
    };
  },

  async draftResponse(ticket, agentName = 'Support Team') {
    try {
      const data = await apiClient.post('/ai/draft-response', { ticket, agentName });
      if (data) return data;
    } catch {
      // Fallback
    }

    const requesterName = ticket.requester?.name ? ticket.requester.name.split(' ')[0] : 'Jordan';
    const text = `${ticket.subject || ''} ${ticket.description || ''}`.toLowerCase();

    let body = `Hi ${requesterName},\n\nThank you for contacting SupportIQ regarding "${ticket.subject}". We are investigating this issue.`;

    if (text.includes('webhook') || text.includes('504') || text.includes('timeout')) {
      body = `Hi ${requesterName},\n\nThank you for reaching out to SupportIQ. I reviewed your report regarding the webhook timeout errors.\n\nCould you please confirm if your endpoint is configured to acknowledge payloads within our 5000ms deadline with a 2xx HTTP response? If the handler executes heavy synchronous work, we recommend offloading that to a background worker and responding immediately.\n\nPlease let me know if the timeouts persist after reviewing your worker latency, and we'll be glad to inspect the delivery logs on our end.\n\nBest regards,\n${agentName}\nSupportIQ Engineering`;
    }

    return {
      draft: body,
      isRuleBased: true,
      provider: 'SupportIQ Heuristic Rule Engine (Local)'
    };
  },

  async rephraseResponse(text, tone = 'Empathetic') {
    try {
      const data = await apiClient.post('/ai/rephrase', { text, tone });
      if (data && data.rephrased) return data.rephrased;
    } catch {
      // Fallback
    }

    if (tone === 'Empathetic') {
      return `I am truly sorry for the trouble this has caused. I completely understand how urgent this is. ${text}`;
    }
    return text;
  },

  async generateArticle(title, category = 'Troubleshooting') {
    try {
      const data = await apiClient.post('/ai/generate-article', { title, category });
      if (data) return data;
    } catch {
      // Fallback
    }

    return {
      title,
      category,
      tags: ['oauth', 'webhook', 'security', 'verification'],
      content: `### Overview\nGuide for ${title}.\n\n### Step-by-Step Instructions\n1. Generate secret key.\n2. Configure payload signature.\n3. Validate signatures in endpoint.`,
      isRuleBased: true,
      provider: 'SupportIQ Heuristic Rule Engine (Local)'
    };
  },

  async askInstantHelp(query, articles = []) {
    try {
      const data = await apiClient.post('/ai/ask-help', { query });
      if (data) return data;
    } catch {
      // Fallback
    }

    const cleanQ = query.toLowerCase();
    const matched = articles.find(a => 
      a.title.toLowerCase().includes('mfa') || 
      a.content.toLowerCase().includes('mfa')
    );

    if (matched) {
      return {
        answer: `Based on "${matched.title}": You can reset your lost MFA recovery code using emergency backup keys.`,
        confidence: 92,
        isRuleBased: true,
        provider: 'SupportIQ Heuristic Rule Engine (Local)'
      };
    }

    return {
      answer: 'No direct article match found. Please submit a support ticket.',
      confidence: 60,
      isRuleBased: true,
      provider: 'SupportIQ Heuristic Rule Engine (Local)'
    };
  }
};
