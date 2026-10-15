import React from 'react';
import { Layers, Activity } from 'lucide-react';

export function PriorityChart({ priorityDistribution = {}, statusDistribution = {}, totalTickets = 0 }) {
  const priorities = [
    { label: 'Urgent', count: priorityDistribution.Urgent || 0, barColor: 'bg-rose-500', textColor: 'text-rose-700', bgBadge: 'bg-rose-50' },
    { label: 'High', count: priorityDistribution.High || 0, barColor: 'bg-orange-500', textColor: 'text-orange-700', bgBadge: 'bg-orange-50' },
    { label: 'Medium', count: priorityDistribution.Medium || 0, barColor: 'bg-amber-500', textColor: 'text-amber-700', bgBadge: 'bg-amber-50' },
    { label: 'Low', count: priorityDistribution.Low || 0, barColor: 'bg-slate-400', textColor: 'text-slate-600', bgBadge: 'bg-slate-100' },
  ];

  const totalPriorityCount = priorities.reduce((sum, p) => sum + p.count, 0) || 1;

  const statuses = [
    { label: 'Open', count: statusDistribution.Open || 0, color: 'text-blue-600', dot: 'bg-blue-500' },
    { label: 'In Progress', count: statusDistribution['In Progress'] || 0, color: 'text-indigo-600', dot: 'bg-indigo-500' },
    { label: 'Waiting for Customer', count: statusDistribution['Waiting for Customer'] || 0, color: 'text-amber-600', dot: 'bg-amber-500' },
    { label: 'Resolved', count: statusDistribution.Resolved || 0, color: 'text-emerald-600', dot: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Workload &amp; Priority Mix</h3>
              <p className="text-xs text-slate-400">Distribution across active tickets</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {totalTickets} total
          </span>
        </div>

        {/* Stacked bar visual representation */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex mb-5 shadow-inner">
          {priorities.map((p) => {
            const pct = (p.count / totalPriorityCount) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={p.label}
                title={`${p.label}: ${p.count} (${Math.round(pct)}%)`}
                style={{ width: `${pct}%` }}
                className={`${p.barColor} h-full transition-all duration-500`}
              />
            );
          })}
        </div>

        {/* Priority breakdown items */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {priorities.map((p) => {
            const pct = Math.round((p.count / totalPriorityCount) * 100);
            return (
              <div
                key={p.label}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.barColor}`} />
                  <span className="text-xs font-medium text-slate-700">{p.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">{p.count}</span>
                  <span className="text-[10px] text-slate-400">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status summary footer */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Status Overview
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {statuses.map((s) => (
            <div key={s.label} className="p-2 rounded-lg bg-slate-50 text-center">
              <p className="text-slate-500 text-[11px] truncate mb-0.5">{s.label}</p>
              <p className={`font-extrabold text-sm ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
