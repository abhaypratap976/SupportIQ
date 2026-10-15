import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from './StatCard';
import { AttentionTicketsSection } from './AttentionTicketsSection';
import { CreateTicketModal } from '../tickets/CreateTicketModal';
import { getGreeting } from '../../utils/formatters';
import { 
  Inbox, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  Headphones, 
  UserCheck, 
  ArrowRight,
  Sparkles,
  Layers,
  Flame,
  Check,
  BookOpen
} from 'lucide-react';

export function AgentDashboardView() {
  const { tickets, assignTicket } = useTickets();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('my-assigned'); // 'my-assigned' | 'unassigned' | 'urgent'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  const allTickets = Array.isArray(tickets) ? tickets : [];
  const openTickets = allTickets.filter(t => t.status !== 'Resolved');

  // Filter queues
  const myAssignedTickets = allTickets.filter(t => {
    const isAssignedToMe = t.assignedTo && (
      t.assignedTo.email?.toLowerCase() === currentUser?.email?.toLowerCase() ||
      t.assignedTo.id === currentUser?.id ||
      t.assignedTo._id === currentUser?.id
    );
    return isAssignedToMe && t.status !== 'Resolved';
  });

  const unassignedTickets = allTickets.filter(t => {
    const isUnassigned = !t.assignedTo || !t.assignedTo.name;
    return isUnassigned && t.status !== 'Resolved';
  });

  const urgentTickets = allTickets.filter(t => 
    (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Resolved'
  );

  const waitingOnCustomerTickets = allTickets.filter(t => 
    t.status === 'Waiting for Customer'
  );

  // Resolved calculations
  const resolvedTickets = allTickets.filter(t => t.status === 'Resolved');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const resolvedTodayCount = resolvedTickets.filter(t => {
    const updatedDate = new Date(t.updatedAt || t.createdAt);
    return updatedDate >= todayStart;
  }).length;

  // Tickets that need attention: Urgent tickets first, then unassigned tickets
  const attentionTickets = [
    ...urgentTickets,
    ...unassignedTickets.filter(u => !urgentTickets.some(t => (t.id || t.ticketId) === (u.id || u.ticketId)))
  ];

  const handleClaimTicket = async (e, ticket) => {
    e.stopPropagation();
    try {
      setClaimingId(ticket.id || ticket.ticketId);
      await assignTicket(ticket.id || ticket.ticketId, currentUser);
      navigate(`/tickets/${ticket.id || ticket.ticketId}`);
    } catch {
      setClaimingId(null);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">Urgent</span>;
      case 'High':
        return <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case 'Medium':
        return <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">Medium</span>;
      default:
        return <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Waiting for Customer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Waiting for Customer
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            In Progress
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Open
          </span>
        );
    }
  };

  // Determine list based on selected tab
  let displayedTickets = myAssignedTickets;
  if (activeTab === 'unassigned') displayedTickets = unassignedTickets;
  if (activeTab === 'urgent') displayedTickets = urgentTickets;

  const greeting = getGreeting();
  const firstName = currentUser?.name?.split(' ')[0] || 'Agent';

  return (
    <div className="space-y-6">
      {/* Clean Agent Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {firstName}! Here is what needs your attention today.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            You currently have <strong>{myAssignedTickets.length}</strong> active tickets assigned to you and <strong>{unassignedTickets.length}</strong> unassigned tickets in queue.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>All Tickets</span>
          </button>
        </div>
      </div>

      {/* 4 Standard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Tickets"
          value={openTickets.length}
          subtitle={`${myAssignedTickets.length} assigned directly to you`}
          icon={Inbox}
          variant="indigo"
          onClick={() => setActiveTab('my-assigned')}
        />

        <StatCard
          title="Urgent Tickets"
          value={urgentTickets.length}
          subtitle={urgentTickets.length > 0 ? "Requires priority response" : "No urgent issues"}
          icon={Flame}
          variant={urgentTickets.length > 0 ? "rose" : "slate"}
          onClick={() => setActiveTab('urgent')}
        />

        <StatCard
          title="Waiting for Customer"
          value={waitingOnCustomerTickets.length}
          subtitle="Pending customer response"
          icon={Clock}
          variant="amber"
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
        subtitle="Urgent escalations or unassigned tickets ready to be claimed"
        emptyMessage="No tickets currently need urgent attention."
        emptySubtext="Personal and unassigned queues are in great shape."
        onClaimTicket={handleClaimTicket}
        claimingId={claimingId}
      />

      {/* Main Agent Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Columns): Tabbed Queue Manager */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          {/* Queue Filter Tabs */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('my-assigned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'my-assigned'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                My Queue ({myAssignedTickets.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('unassigned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'unassigned'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unassigned ({unassignedTickets.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('urgent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'urgent'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Urgent ({urgentTickets.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:underline"
            >
              Open Full Desk &rarr;
            </button>
          </div>

          {/* Ticket Cards List */}
          {displayedTickets.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {activeTab === 'my-assigned' && "Your personal queue is clear!"}
                {activeTab === 'unassigned' && "No unassigned tickets right now!"}
                {activeTab === 'urgent' && "No urgent tickets pending!"}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeTab === 'my-assigned' && "Great job. Switch to the unassigned queue to claim new customer queries."}
                {activeTab === 'unassigned' && "All incoming tickets have already been assigned to team members."}
                {activeTab === 'urgent' && "All urgent SLA escalations are currently resolved."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedTickets.slice(0, 6).map((ticket) => (
                <div
                  key={ticket.id || ticket.ticketId}
                  onClick={() => navigate(`/tickets/${ticket.id || ticket.ticketId}`)}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {ticket.ticketId || ticket.id}
                        </span>
                        {getPriorityBadge(ticket.priority)}
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {ticket.category || 'General'}
                        </span>
                        {getStatusBadge(ticket.status)}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {ticket.subject}
                      </h4>

                      <p className="text-xs text-slate-500">
                        Customer: <strong className="text-slate-700">{ticket.requester?.name || 'Customer'}</strong>
                        {ticket.requester?.company ? ` (${ticket.requester.company})` : ''}
                      </p>
                    </div>

                    {/* Claim Button if Unassigned, or Open Button */}
                    <div className="flex-shrink-0">
                      {activeTab === 'unassigned' ? (
                        <button
                          type="button"
                          disabled={claimingId === (ticket.id || ticket.ticketId)}
                          onClick={(e) => handleClaimTicket(e, ticket)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all inline-flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{claimingId === (ticket.id || ticket.ticketId) ? 'Claiming...' : 'Claim & Open'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/tickets/${ticket.id || ticket.ticketId}`)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <span>Open Ticket</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right (1 Column): AI Copilot Helper & Quick Resolution Tips */}
        <div className="space-y-4">
          {/* AI Productivity Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-5 shadow-xs space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-bold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Resolution Assistant</span>
            </div>
            <h4 className="text-sm font-bold">Speed up ticket replies with AI</h4>
            <p className="text-xs text-indigo-100 leading-relaxed">
              When viewing any ticket, click <strong>&ldquo;AI Draft Reply&rdquo;</strong> to automatically generate empathetic, accurate responses based on conversation history and knowledge base context.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200">
              <span>• Auto Triage &amp; Summaries</span>
              <span>• Internal Notes Privacy</span>
            </div>
          </div>

          {/* Quick Knowledge Base Reference */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Internal Knowledge &amp; Docs
            </h4>
            <p className="text-xs text-slate-600">
              Need technical specs or standard response procedures? Browse published articles.
            </p>
            <button
              type="button"
              onClick={() => navigate('/knowledge-base')}
              className="w-full py-2 px-3 text-center text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              Open Knowledge Base &rarr;
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
