import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { EmptyState } from '../common/EmptyState';
import { formatRelativeTime, getTicketAge } from '../../utils/formatters';
import { STATUSES, PRIORITIES } from '../../data/seedData';
import { 
  MessageSquare, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  ArrowRight, 
  SearchX,
  PlusCircle
} from 'lucide-react';

export function TicketList({ onOpenCreateModal }) {
  const { 
    filteredTickets, 
    updateStatus, 
    updatePriority, 
    assignTicket, 
    clearFilters 
  } = useTickets();
  const { currentUser, availableUsers, isCustomer, isAgent } = useAuth();
  const navigate = useNavigate();

  const agentList = availableUsers.filter(u => u.role === 'Agent' || u.role === 'Admin');

  if (filteredTickets.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No tickets found"
        description="Try changing your search terms or filters."
        actionLabel={isCustomer ? "+ New Ticket" : "Clear filters"}
        actionIcon={isCustomer ? PlusCircle : undefined}
        onAction={isCustomer ? onOpenCreateModal : clearFilters}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 min-w-[280px]">Ticket</th>
              <th className="py-3.5 px-4 w-[170px] min-w-[170px]">Status</th>
              <th className="py-3.5 px-4 w-[110px] min-w-[110px]">Priority</th>
              <th className="py-3.5 px-4 w-[140px] min-w-[140px]">Category</th>
              <th className="py-3.5 px-4 w-[180px] min-w-[180px]">{isCustomer ? 'Support Engineer' : 'Customer'}</th>
              {!isCustomer && <th className="py-3.5 px-4 w-[160px] min-w-[160px]">Assigned to</th>}
              <th className="py-3.5 px-4 w-[90px] min-w-[90px] text-right">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const age = getTicketAge(ticket.createdAt);
              const isUnresolvedOld = ticket.status !== 'Resolved' && age.isOld;

              return (
                <tr
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
                    isUnresolvedOld ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Ticket Subject & ID */}
                  <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                    <div className="flex items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {ticket.id}
                          </span>
                          {isUnresolvedOld && (
                            <span 
                              title={`Old unresolved ticket (${age.text} open)`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {age.text}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mt-1 truncate">
                          {ticket.subject}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.conversation?.length || 1}
                          </span>
                          <span>•</span>
                          <span>Updated {formatRelativeTime(ticket.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {isAgent ? (
                      <select
                        value={ticket.status}
                        onChange={(e) => updateStatus(ticket.id, e.target.value)}
                        className={`w-[155px] text-xs font-semibold rounded-lg border py-1.5 pl-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all ${
                          ticket.status === 'Open'
                            ? 'bg-blue-50/90 text-blue-700 border-blue-200 hover:bg-blue-100/60'
                            : ticket.status === 'In Progress'
                            ? 'bg-indigo-50/90 text-indigo-700 border-indigo-200 hover:bg-indigo-100/60'
                            : ticket.status === 'Waiting for Customer'
                            ? 'bg-amber-50/90 text-amber-800 border-amber-200 hover:bg-amber-100/60'
                            : 'bg-emerald-50/90 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60'
                        }`}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={ticket.status} />
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {isAgent ? (
                      <select
                        value={ticket.priority}
                        onChange={(e) => updatePriority(ticket.id, e.target.value)}
                        className={`w-[100px] text-xs font-semibold rounded-lg border py-1.5 pl-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all ${
                          ticket.priority === 'Urgent'
                            ? 'bg-rose-50/90 text-rose-700 border-rose-200 font-bold hover:bg-rose-100/60'
                            : ticket.priority === 'High'
                            ? 'bg-amber-50/90 text-amber-800 border-amber-200 font-semibold hover:bg-amber-100/60'
                            : ticket.priority === 'Medium'
                            ? 'bg-blue-50/90 text-blue-700 border-blue-200 hover:bg-blue-100/60'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60'
                        }`}
                      >
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : (
                      <PriorityBadge priority={ticket.priority} />
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <CategoryBadge category={ticket.category} />
                  </td>

                  {/* Requester (Staff) or Assigned Engineer (Customer) */}
                  <td className="py-3.5 px-4">
                    {isCustomer ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 border border-indigo-100">
                          {ticket.assignedTo?.name ? ticket.assignedTo.name[0] : 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-slate-800 truncate">
                            {ticket.assignedTo?.name || 'Support Desk'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {ticket.assignedTo?.name ? (ticket.assignedTo.title || 'Engineer') : 'In Dispatch Queue'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={ticket.requester?.avatar}
                          name={ticket.requester?.name}
                          className="w-6 h-6"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-slate-800 truncate">
                            {ticket.requester?.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {ticket.requester?.company || ticket.requester?.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Assignee (Staff only) */}
                  {!isCustomer && (
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={ticket.assignedTo?.id || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const selected = val ? agentList.find(a => a.id === val) : null;
                          assignTicket(ticket.id, selected);
                        }}
                        className={`w-[145px] text-xs rounded-lg border py-1.5 pl-2.5 pr-7 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all ${
                          ticket.assignedTo 
                            ? 'font-medium bg-white border-slate-300 text-slate-700 hover:bg-slate-50 focus:border-indigo-600' 
                            : 'font-semibold bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/50 focus:border-amber-500'
                        }`}
                      >
                        <option value="">Unassigned</option>
                        {agentList.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </td>
                  )}

                  {/* Age */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(ticket.createdAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredTickets.map((ticket) => {
          const age = getTicketAge(ticket.createdAt);
          const isUnresolvedOld = ticket.status !== 'Resolved' && age.isOld;

          return (
            <div
              key={ticket.id}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                isUnresolvedOld ? 'bg-amber-50/20' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {ticket.id}
                </span>
                <span className="text-xs text-slate-400">
                  {formatRelativeTime(ticket.createdAt)}
                </span>
              </div>

              <h4 className="font-semibold text-slate-900 text-sm mb-2">
                {ticket.subject}
              </h4>

              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <CategoryBadge category={ticket.category} />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={ticket.requester?.avatar}
                    name={ticket.requester?.name}
                    className="w-5 h-5 text-[9px]"
                  />
                  <span className="truncate max-w-[120px] font-medium text-slate-700">
                    {ticket.requester?.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-indigo-600">
                  <span>View ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
