import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { Avatar } from '../common/Avatar';
import { 
  LayoutDashboard, 
  TicketCheck, 
  BookOpen, 
  PlusCircle, 
  X, 
  LifeBuoy, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Users,
  LogOut,
  LogIn
} from 'lucide-react';

export function Sidebar({ isOpen, onClose, onOpenCreateTicket }) {
  const { currentUser, isCustomer, isAdmin, logout } = useAuth();
  const { analytics } = useTickets();
  const navigate = useNavigate();

  if (!currentUser) {
    return null;
  }

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/tickets',
      label: isCustomer ? 'My Tickets' : 'All Tickets',
      icon: TicketCheck,
      badge: analytics?.totalOpenTickets > 0 ? analytics.totalOpenTickets : null
    },
    {
      to: '/knowledge-base',
      label: 'Help Articles',
      icon: BookOpen,
      badge: null
    },
    ...(isAdmin ? [
      {
        to: '/users',
        label: 'Team & Users',
        icon: Users,
        badge: null
      }
    ] : [])
  ];

  const handleCreateClick = () => {
    if (onClose) onClose();
    if (onOpenCreateTicket) {
      onOpenCreateTicket();
    } else {
      navigate('/tickets?action=new');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                Support<span className="text-indigo-600">IQ</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block -mt-1 tracking-wider uppercase">
                Customer Support
              </span>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: Create Ticket */}
        <div className="p-4 border-b border-slate-100">
          <button
            type="button"
            onClick={handleCreateClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all group"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>+ New Ticket</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Current User Card at bottom of sidebar */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5 mb-2.5">
            <Avatar
              src={currentUser.avatar}
              name={currentUser.name}
              className="w-8 h-8"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-semibold text-slate-500 truncate">
                  {currentUser.role}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/70">
            <button
              type="button"
              onClick={async () => {
                if (onClose) onClose();
                await logout();
                navigate('/login');
              }}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg py-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
