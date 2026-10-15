import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/formatters';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Inbox, ArrowRight } from 'lucide-react';

export function RecentTicketsCard({ recentTickets = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Inbox className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Activity Stream</h3>
            <p className="text-xs text-slate-400">Latest incoming tickets across all queues</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
        >
          <span>All tickets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {recentTickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                src={ticket.requester?.avatar}
                name={ticket.requester?.name}
                className="w-7 h-7"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-indigo-600">
                    {ticket.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-xs sm:max-w-md">
                    {ticket.subject}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  From {ticket.requester?.name} • {ticket.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <StatusBadge status={ticket.status} className="hidden sm:inline-flex" />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {formatRelativeTime(ticket.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
