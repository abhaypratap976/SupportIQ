import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Globe, AlertTriangle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export function StatusBadge({ status, className = '', isCustomer: isCustomerProp }) {
  let isCustomer = isCustomerProp;
  try {
    const auth = useAuth();
    if (isCustomer === undefined && auth) {
      isCustomer = auth.isCustomer;
    }
  } catch {
    // fallback if outside AuthProvider
  }

  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;
  let label = status;

  switch (status) {
    case 'Open':
      style = 'bg-blue-50 text-blue-700 border-blue-200';
      Icon = AlertCircle;
      label = 'Open';
      break;
    case 'In Progress':
      style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = Clock;
      label = 'In Progress';
      break;
    case 'Waiting for Customer':
      style = isCustomer 
        ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse' 
        : 'bg-amber-50 text-amber-700 border-amber-200';
      Icon = Clock;
      label = isCustomer ? 'Awaiting Your Reply' : 'Waiting for Customer';
      break;
    case 'Resolved':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = CheckCircle2;
      label = 'Resolved';
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
}

export function PriorityBadge({ priority, className = '' }) {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  switch (priority) {
    case 'Urgent':
      style = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      dotColor = 'bg-rose-500 animate-pulse';
      break;
    case 'High':
      style = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
      dotColor = 'bg-orange-500';
      break;
    case 'Medium':
      style = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      break;
    case 'Low':
      style = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${style} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{priority}</span>
    </span>
  );
}

export function CategoryBadge({ category, className = '' }) {
  let style = 'bg-slate-100 text-slate-600 border-slate-200';

  switch (category) {
    case 'Technical Issue':
      style = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case 'Billing':
      style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'Account Access':
      style = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'Feature Request':
      style = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      break;
    case 'General Inquiry':
      style = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style} ${className}`}
    >
      {category}
    </span>
  );
}

export function VisibilityBadge({ visibility }) {
  if (visibility === 'internal') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <Lock className="w-3 h-3 text-amber-700" />
        Internal Note (Staff Only)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      <Globe className="w-3 h-3 text-slate-500" />
      Public Reply
    </span>
  );
}
