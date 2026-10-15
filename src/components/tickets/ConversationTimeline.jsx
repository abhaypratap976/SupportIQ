import React from 'react';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { VisibilityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { Lock, User, Headphones, ShieldAlert } from 'lucide-react';

export function ConversationTimeline({ conversation = [], requester }) {
  if (!conversation || conversation.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
        No conversation recorded yet.
      </div>
    );
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <ShieldAlert className="w-3 h-3 text-purple-600" />;
      case 'Agent':
        return <Headphones className="w-3 h-3 text-indigo-600" />;
      case 'Customer':
        return <User className="w-3 h-3 text-emerald-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {conversation.map((msg, index) => {
        const isInternal = msg.visibility === 'internal';
        const isCustomer = msg.author?.role === 'Customer';

        return (
          <div
            key={msg.id || index}
            className={`rounded-xl border transition-all ${
              isInternal
                ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            {/* Message Header */}
            <div
              className={`px-4 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
                isInternal
                  ? 'border-amber-200/60 bg-amber-100/40'
                  : 'border-slate-100 bg-slate-50/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={msg.author?.avatar}
                  name={msg.author?.name}
                  className="w-7 h-7"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {msg.author?.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {getRoleIcon(msg.author?.role)}
                      {msg.author?.role}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                        Initial Ticket Submission
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatDateTime(msg.createdAt)} ({formatRelativeTime(msg.createdAt)})
                  </p>
                </div>
              </div>

              {/* Visibility Tag */}
              <div>
                <VisibilityBadge visibility={msg.visibility} />
              </div>
            </div>

            {/* Message Body */}
            <div className="p-4 sm:p-5">
              {isInternal && (
                <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-medium flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span>
                    <strong>Private Staff Note:</strong> This comment is strictly hidden from customer view.
                  </span>
                </div>
              )}

              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
