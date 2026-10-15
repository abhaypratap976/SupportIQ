import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, getTicketAge } from '../../utils/formatters';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { AlertTriangle, Clock, ArrowRight, UserCheck, CheckCircle2, User } from 'lucide-react';

export function AttentionTicketsSection({ 
  tickets = [], 
  title = "Tickets that need attention",
  subtitle = "High priority or oldest unresolved tickets requiring prompt response",
  emptyMessage = "No tickets currently need urgent attention.",
  emptySubtext = "Great job! All queues are caught up.",
  onClaimTicket = null,
  claimingId = null,
  isCustomer = false
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200/60">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-2">
              <span>{title}</span>
              {tickets.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {tickets.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tickets')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View all tickets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">{emptyMessage}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {emptySubtext}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tickets.slice(0, 5).map((ticket, index) => {
            const age = getTicketAge(ticket.createdAt);
            const isUnassigned = !ticket.assignedTo || !ticket.assignedTo.name;

            return (
              <div
                key={ticket.id || ticket.ticketId}
                onClick={() => navigate(`/tickets/${ticket.id || ticket.ticketId}`)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:border-indigo-300 hover:shadow-xs group ${
                  ticket.priority === 'Urgent'
                    ? 'bg-rose-50/40 border-rose-200'
                    : ticket.status === 'Waiting for Customer' && isCustomer
                    ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-200/50'
                    : 'bg-white hover:bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        {ticket.ticketId || ticket.id}
                      </span>
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {ticket.category || 'General'}
                      </span>
                      {age.isOld && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Open {age.text}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {ticket.subject}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>
                        Requester: <strong className="text-slate-700">{ticket.requester?.name || 'Customer'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Assigned to: <strong className="text-slate-700">{ticket.assignedTo?.name || 'Unassigned'}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        Updated {formatRelativeTime(ticket.updatedAt || ticket.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {onClaimTicket && isUnassigned ? (
                      <button
                        type="button"
                        disabled={claimingId === (ticket.id || ticket.ticketId)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onClaimTicket(e, ticket);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all inline-flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{claimingId === (ticket.id || ticket.ticketId) ? 'Claiming...' : 'Claim & Open'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tickets/${ticket.id || ticket.ticketId}`);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
                      >
                        <span>{isCustomer && ticket.status === 'Waiting for Customer' ? 'Send Reply' : 'Open Ticket'}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
