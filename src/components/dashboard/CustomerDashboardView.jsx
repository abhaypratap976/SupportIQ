import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { useArticles } from '../../context/ArticleContext';
import { StatCard } from './StatCard';
import { AttentionTicketsSection } from './AttentionTicketsSection';
import { CreateTicketModal } from '../tickets/CreateTicketModal';
import { getGreeting } from '../../utils/formatters';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  BookOpen, 
  Search, 
  ArrowRight,
  MessageSquare,
  HelpCircle,
  AlertCircle,
  Flame
} from 'lucide-react';

export function CustomerDashboardView() {
  const { tickets } = useTickets();
  const { currentUser } = useAuth();
  const { articles } = useArticles();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [kbQuery, setKbQuery] = useState('');

  // Calculate customer-specific metrics
  const customerTickets = Array.isArray(tickets) ? tickets : [];
  const openTickets = customerTickets.filter(t => t.status !== 'Resolved');
  const urgentTickets = customerTickets.filter(t => 
    (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Resolved'
  );
  const awaitingReplyTickets = customerTickets.filter(t => t.status === 'Waiting for Customer');
  const resolvedTickets = customerTickets.filter(t => t.status === 'Resolved');

  // Resolved today calculation
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const resolvedTodayCount = resolvedTickets.filter(t => {
    const updatedDate = new Date(t.updatedAt || t.createdAt);
    return updatedDate >= todayStart;
  }).length;

  // Tickets needing customer attention: awaiting reply first, then urgent
  const attentionTickets = [
    ...awaitingReplyTickets,
    ...urgentTickets.filter(t => t.status !== 'Waiting for Customer')
  ];

  const greeting = getGreeting();
  const firstName = currentUser?.name?.split(' ')[0] || 'Friend';

  const handleKbSearch = (e) => {
    e.preventDefault();
    if (kbQuery.trim()) {
      navigate(`/knowledge-base?search=${encodeURIComponent(kbQuery.trim())}`);
    } else {
      navigate('/knowledge-base');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Waiting for Customer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Awaiting Your Reply
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Open
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100">Urgent</span>;
      case 'High':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">High</span>;
      default:
        return <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">Standard</span>;
    }
  };

  // Popular articles for customer self-service
  const popularArticles = (articles || []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Clean Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {firstName}! Here is what needs your attention today.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your open support requests, reply to engineer updates, or search instant help articles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/knowledge-base')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Help Articles</span>
          </button>
        </div>
      </div>

      {/* 4 Standard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Tickets"
          value={openTickets.length}
          subtitle="Currently open or under investigation"
          icon={Inbox}
          variant="indigo"
          onClick={() => navigate('/tickets?status=Open')}
        />

        <StatCard
          title="Urgent Tickets"
          value={urgentTickets.length}
          subtitle={urgentTickets.length > 0 ? "Requires priority response" : "No urgent issues"}
          icon={Flame}
          variant={urgentTickets.length > 0 ? "rose" : "slate"}
          onClick={() => navigate('/tickets?priority=Urgent')}
        />

        <StatCard
          title="Waiting for Customer"
          value={awaitingReplyTickets.length}
          subtitle={awaitingReplyTickets.length > 0 ? "Support team replied — needs your input" : "All caught up on responses"}
          icon={Clock}
          variant={awaitingReplyTickets.length > 0 ? "amber" : "sky"}
          onClick={() => navigate('/tickets?status=Waiting+for+Customer')}
        />

        <StatCard
          title="Resolved Today"
          value={resolvedTodayCount > 0 ? resolvedTodayCount : resolvedTickets.length}
          subtitle={resolvedTodayCount > 0 ? "Resolved today" : `${resolvedTickets.length} resolved total`}
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => navigate('/tickets?status=Resolved')}
        />
      </div>

      {/* Section: Tickets that need attention */}
      <AttentionTicketsSection
        tickets={attentionTickets}
        title="Tickets that need attention"
        subtitle="Conversations where support is awaiting your reply or tickets marked urgent"
        emptyMessage="No tickets currently need your reply."
        emptySubtext="All your tickets are being handled by our support engineers."
        isCustomer={true}
      />


      {/* Main Grid: My Support Requests + Knowledge Center Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Columns): My Tickets List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>My Support Requests</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                  {customerTickets.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Recent conversations and tickets opened under your account
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Ticket</span>
            </button>
          </div>

          {customerTickets.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No support requests yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Whenever you encounter a technical bug, billing question, or general inquiry, open a ticket and our team will resolve it.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Your First Ticket</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {customerTickets.slice(0, 5).map((t) => (
                <div
                  key={t.id || t.ticketId}
                  onClick={() => navigate(`/tickets/${t.id || t.ticketId}`)}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {t.ticketId || t.id}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {t.category || 'Support'}
                      </span>
                      {getPriorityBadge(t.priority)}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {t.subject}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Opened {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {t.assignedTo?.name ? ` • Assigned to ${t.assignedTo.name}` : ' • In Dispatch Queue'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                    {getStatusBadge(t.status)}
                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))}

              {customerTickets.length > 5 && (
                <div className="pt-3 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/tickets')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    View all {customerTickets.length} tickets &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right (1 Column): Knowledge Base Quick Access */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Self-Service Help Center</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Find answers right away without waiting for support reply.
              </p>
            </div>

            {/* Quick Search */}
            <form onSubmit={handleKbSearch} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={kbQuery}
                onChange={(e) => setKbQuery(e.target.value)}
                placeholder="Search troubleshooting guides..."
                className="w-full h-9 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-xs"
              />
            </form>

            {/* Popular Guides */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Popular Guides
              </p>
              {popularArticles.map((art) => (
                <button
                  key={art.id || art.articleId}
                  type="button"
                  onClick={() => navigate(`/knowledge-base/${art.slug || art.articleId || art.id}`)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-all group"
                >
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 line-clamp-1">
                    {art.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{art.category || 'General'}</span>
                    <span>{art.helpfulCount || 0} found helpful</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('/knowledge-base')}
              className="w-full py-2 text-center text-xs font-bold text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/70 rounded-xl transition-colors"
            >
              Browse All Knowledge Articles &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Creating Tickets */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(ticket) => navigate(`/tickets/${ticket.id || ticket.ticketId}`)}
      />
    </div>
  );
}
