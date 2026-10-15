import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, getTicketAge } from '../../utils/formatters';
import { PriorityBadge, StatusBadge } from '../common/Badge';
import { Clock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export function OldestTicketsCard({ oldestTickets = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Oldest Unresolved Tickets
              </h3>
              <p className="text-xs text-slate-400">
                Prioritized queue requiring prompt SLA resolution
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            SLA Risk Focus
          </span>
        </div>

        {oldestTickets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
            <p className="font-semibold text-slate-700">All caught up!</p>
            <p className="text-slate-400">No unresolved tickets pending.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {oldestTickets.map((ticket, index) => {
              const age = getTicketAge(ticket.createdAt);
              const isVeryOld = age.hours >= 48;

              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-indigo-300 group ${
                    index === 0
                      ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-200/70'
                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {ticket.id}
                      </span>
                      {index === 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Oldest Unresolved ({age.text})
                        </span>
                      )}
                      {index > 0 && (
                        <span className="text-[11px] font-medium text-amber-700">
                          {age.text} open
                        </span>
                      )}
                    </div>
                    <PriorityBadge priority={ticket.priority} />
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {ticket.subject}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span className="truncate max-w-[150px]">
                      {ticket.requester?.name} ({ticket.requester?.company || 'Customer'})
                    </span>
                    <span className="flex items-center gap-1 text-indigo-600 font-semibold group-hover:underline">
                      Review <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Tickets open &gt; 48 hours trigger high attention</span>
        <button
          onClick={() => navigate('/tickets?sort=oldest')}
          className="text-indigo-600 font-semibold hover:underline"
        >
          View queue &rarr;
        </button>
      </div>
    </div>
  );
}
