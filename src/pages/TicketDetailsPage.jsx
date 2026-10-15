import React, { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTickets } from '../context/TicketContext';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { ConversationTimeline } from '../components/tickets/ConversationTimeline';
import { ReplyComposer } from '../components/tickets/ReplyComposer';
import { AIAssistantPanel } from '../components/tickets/AIAssistantPanel';
import { RelatedArticles } from '../components/knowledge-base/RelatedArticles';
import { formatDateTime, formatRelativeTime, getTicketAge } from '../utils/formatters';
import { STATUSES, PRIORITIES, CATEGORIES } from '../data/seedData';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  Headphones, 
  Building, 
  Mail,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const composerRef = useRef(null);

  const { 
    updateStatus, 
    updatePriority, 
    updateCategory, 
    assignTicket, 
    addMessage 
  } = useTickets();
  const { currentUser, availableUsers, isCustomer, isAgent, isAdmin } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const loadTicket = React.useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await ticketService.getById(id);
      if (data) {
        setTicket(data);
      } else {
        setFetchError('The requested ticket does not exist, or you do not have permission to view it.');
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const agentList = availableUsers.filter(u => u.role === 'Agent' || u.role === 'Admin');

  if (loading && !ticket) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading ticket {id}...
        </p>
      </div>
    );
  }

  if (!ticket || fetchError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Ticket Not Accessible</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          {fetchError || 'The requested ticket does not exist, or you do not have permission to view it.'}
        </p>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </Link>
      </div>
    );
  }

  const age = getTicketAge(ticket.createdAt);
  const isOldUnresolved = ticket.status !== 'Resolved' && age.isOld;

  const handleInsertDraft = (text) => {
    if (composerRef.current) {
      composerRef.current.insertText(text);
      // Smooth scroll to composer
      const composerElement = document.getElementById('reply-composer-section');
      if (composerElement) {
        composerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleInsertArticleLink = (linkText) => {
    if (composerRef.current) {
      const current = composerRef.current.getContent();
      composerRef.current.insertText(current + linkText);
      const composerElement = document.getElementById('reply-composer-section');
      if (composerElement) {
        composerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to tickets</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Created {formatDateTime(ticket.createdAt)}</span>
        </div>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                {ticket.id}
              </span>

              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <CategoryBadge category={ticket.category} />

              {isOldUnresolved && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Old Unresolved ({age.text})
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {ticket.subject}
            </h1>
          </div>

          {/* Quick Controls Toolbar (Staff only) */}
          {!isCustomer && (
            <div className="flex flex-wrap items-end gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 self-start">
              {/* Mark as Resolved button */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Action
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const newStatus = ticket.status === 'Resolved' ? 'In Progress' : 'Resolved';
                    await updateStatus(ticket.id, newStatus);
                    loadTicket();
                  }}
                  className={`h-[34px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    ticket.status === 'Resolved'
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{ticket.status === 'Resolved' ? 'Reopen Ticket' : 'Mark as Resolved'}</span>
                </button>
              </div>

              {/* Status Selector */}
              <div className="w-[155px]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={ticket.status}
                  onChange={async (e) => {
                    await updateStatus(ticket.id, e.target.value);
                    loadTicket();
                  }}
                  className="w-full h-[34px] text-xs font-semibold rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div className="w-[105px]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={ticket.priority}
                  onChange={async (e) => {
                    await updatePriority(ticket.id, e.target.value);
                    loadTicket();
                  }}
                  className="w-full h-[34px] text-xs font-semibold rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Category Selector */}
              <div className="w-[140px]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={ticket.category}
                  onChange={async (e) => {
                    await updateCategory(ticket.id, e.target.value);
                    loadTicket();
                  }}
                  className="w-full h-[34px] text-xs font-semibold rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Assigned to Selector */}
              <div className="w-[150px]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Assigned to
                </label>
                <select
                  value={ticket.assignedTo?.id || ''}
                  onChange={async (e) => {
                    const agent = e.target.value
                      ? agentList.find(a => a.id === e.target.value)
                      : null;
                    await assignTicket(ticket.id, agent);
                    loadTicket();
                  }}
                  className="w-full h-[34px] text-xs font-semibold rounded-lg border border-slate-300 bg-white py-1.5 pl-2.5 pr-7 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Unassigned</option>
                  {agentList.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Conversation & Reply */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Conversation
              </h2>
              <span className="text-xs text-slate-500">
                {ticket.conversation?.length || 0} messages
              </span>
            </div>

            <ConversationTimeline
              conversation={ticket.conversation}
              requester={ticket.requester}
            />
          </div>

          {/* Reply Composer */}
          <div id="reply-composer-section" className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Send Reply
            </h2>
            <ReplyComposer
              ref={composerRef}
              onSubmitMessage={async ({ content, visibility }) => {
                await addMessage(ticket.id, { content, visibility });
                loadTicket();
              }}
            />
          </div>
        </div>

        {/* Right 1 Column: Meta Sidebar, AI Assistant, Related Help Articles */}
        <div className="space-y-6">
          {/* AI Assistance Panel (Staff Only) */}
          {!isCustomer && (
            <AIAssistantPanel
              ticket={ticket}
              onInsertDraft={handleInsertDraft}
            />
          )}

          {/* Customer Information Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Customer Information
            </h3>
            <div className="flex items-center gap-3">
              <Avatar
                src={ticket.requester?.avatar}
                name={ticket.requester?.name}
                className="w-10 h-10"
              />
              <div className="min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">
                  {ticket.requester?.name}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 truncate mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{ticket.requester?.email}</span>
                </p>
                {ticket.requester?.company && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate mt-0.5">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{ticket.requester.company}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Assigned to Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Assigned to
              </h3>
              {!isCustomer && !ticket.assignedTo && (
                <button
                  type="button"
                  onClick={async () => {
                    await assignTicket(ticket.id, currentUser);
                    loadTicket();
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Assign to me
                </button>
              )}
            </div>
            {ticket.assignedTo ? (
              <div className="flex items-center gap-3">
                <Avatar
                  src={ticket.assignedTo.avatar}
                  name={ticket.assignedTo.name}
                  className="w-10 h-10"
                />
                <div>
                  <p className="font-bold text-sm text-slate-900">
                    {ticket.assignedTo.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ticket.assignedTo.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>Unassigned</span>
                {!isCustomer && (
                  <button
                    type="button"
                    onClick={async () => {
                      await assignTicket(ticket.id, currentUser);
                      loadTicket();
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Claim
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Related Articles Box */}
          <RelatedArticles
            ticket={ticket}
            onInsertLink={handleInsertArticleLink}
          />
        </div>
      </div>
    </div>
  );
}
