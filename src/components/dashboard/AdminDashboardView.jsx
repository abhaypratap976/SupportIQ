import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from './StatCard';
import { AttentionTicketsSection } from './AttentionTicketsSection';
import { RecentTicketsCard } from './RecentTicketsCard';
import { CreateTicketModal } from '../tickets/CreateTicketModal';
import { Avatar } from '../common/Avatar';
import { getGreeting } from '../../utils/formatters';
import { 
  Inbox, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  Clock,
  Users, 
  BookOpen, 
  Flame
} from 'lucide-react';

export function AdminDashboardView() {
  const { analytics, tickets } = useTickets();
  const { currentUser, users } = useAuth();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const staffMembers = (users || []).filter(u => u.role === 'Admin' || u.role === 'Agent');

  const greeting = getGreeting();
  const firstName = currentUser?.name?.split(' ')[0] || 'Admin';

  const allTickets = Array.isArray(tickets) ? tickets : [];
  const waitingForCustomerCount = analytics?.statusDistribution?.['Waiting for Customer'] || 
    allTickets.filter(t => t.status === 'Waiting for Customer').length;

  // Tickets needing attention: Urgent tickets first, then oldest unresolved
  const urgentTickets = allTickets.filter(t => 
    (t.priority === 'Urgent' || t.priority === 'High') && t.status !== 'Resolved'
  );
  const oldestUnresolved = analytics?.oldestUnresolved || [];
  const attentionTickets = [
    ...urgentTickets,
    ...oldestUnresolved.filter(o => !urgentTickets.some(u => (u.id || u.ticketId) === (o.id || o.ticketId)))
  ];

  return (
    <div className="space-y-6">
      {/* Clean Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {firstName}! Here is what needs your attention today.
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Workspace overview across <strong>{analytics?.totalTickets || 0}</strong> tickets, <strong>{staffMembers.length || 1}</strong> active support staff, and queues.
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
            onClick={() => navigate('/users')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Team &amp; Users</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/knowledge-base')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
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
          value={analytics?.totalOpenTickets || 0}
          subtitle="Unresolved / Active across company"
          icon={Inbox}
          variant="indigo"
          onClick={() => navigate('/tickets?status=Open')}
        />

        <StatCard
          title="Urgent Tickets"
          value={analytics?.highPriorityTicketsCount || 0}
          subtitle="Immediate response required"
          icon={Flame}
          variant={analytics?.highPriorityTicketsCount > 0 ? "rose" : "slate"}
          onClick={() => navigate('/tickets?priority=Urgent')}
        />

        <StatCard
          title="Waiting for Customer"
          value={waitingForCustomerCount}
          subtitle="Pending customer response"
          icon={Clock}
          variant="amber"
          onClick={() => navigate('/tickets?status=Waiting+for+Customer')}
        />

        <StatCard
          title="Resolved Today"
          value={analytics?.resolvedTicketsCount || 0}
          subtitle="Successfully closed issues"
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => navigate('/tickets?status=Resolved')}
        />
      </div>

      {/* Section: Tickets that need attention */}
      <AttentionTicketsSection
        tickets={attentionTickets}
        title="Tickets that need attention"
        subtitle="Critical escalations and oldest unresolved tickets requiring staff action"
        emptyMessage="No tickets currently need urgent attention."
        emptySubtext="SLA targets are met and queues are running smoothly."
      />

      {/* Team Roster Quick Overview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Team Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Active Support Team</span>
            </h3>
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline"
            >
              Manage &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {staffMembers.slice(0, 5).map((member) => (
              <div
                key={member.id || member._id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    src={member.avatar}
                    name={member.name}
                    className="w-7 h-7"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {member.title || member.email}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  member.role === 'Admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/users')}
            className="w-full py-2 text-center text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
          >
            + Add or Manage Team Members
          </button>
        </div>

        {/* Right (2 Columns): Recent Activity Stream */}
        <div className="lg:col-span-2">
          <RecentTicketsCard recentTickets={analytics?.recentTickets} />
        </div>
      </div>

      {/* Global Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(ticket) => navigate(`/tickets/${ticket.id || ticket.ticketId}`)}
      />
    </div>
  );
}
