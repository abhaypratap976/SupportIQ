import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'indigo',
  onClick
}) {
  const variants = {
    indigo: {
      bgIcon: 'bg-indigo-50 text-indigo-600',
      border: 'border-slate-200 hover:border-indigo-300',
      valColor: 'text-indigo-950'
    },
    rose: {
      bgIcon: 'bg-rose-50 text-rose-600',
      border: 'border-slate-200 hover:border-rose-300',
      valColor: 'text-rose-950'
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600',
      border: 'border-slate-200 hover:border-amber-300',
      valColor: 'text-amber-950'
    },
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600',
      border: 'border-slate-200 hover:border-emerald-300',
      valColor: 'text-emerald-950'
    },
    purple: {
      bgIcon: 'bg-purple-50 text-purple-600',
      border: 'border-slate-200 hover:border-purple-300',
      valColor: 'text-purple-950'
    },
    sky: {
      bgIcon: 'bg-sky-50 text-sky-600',
      border: 'border-slate-200 hover:border-sky-300',
      valColor: 'text-sky-950'
    },
    blue: {
      bgIcon: 'bg-blue-50 text-blue-600',
      border: 'border-slate-200 hover:border-blue-300',
      valColor: 'text-blue-950'
    }
  };

  const currentVariant = variants[variant] || variants.indigo;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      } ${currentVariant.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className={`text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight ${currentVariant.valColor}`}>
            {value}
          </h3>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${currentVariant.bgIcon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {onClick && <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      )}
    </div>
  );
}
