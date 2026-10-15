import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { 
  Menu, 
  ShieldAlert, 
  Headphones, 
  User, 
  ChevronDown,
  Users, 
  LogOut, 
  LogIn, 
  BookOpen
} from 'lucide-react';

export function Navbar({ onToggleSidebar, showSidebar = true }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />;
      case 'Agent':
        return <Headphones className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Customer':
        return <User className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return null;
    }
  };

  const handleLogout = async () => {
    setShowRoleDropdown(false);
    try {
      await logout();
    } catch {
      // ignore
    }
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & branding display */}
        <div className="flex items-center gap-3">
          {showSidebar && (
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Logo is hidden on desktop if sidebar is open; visible on all screen sizes if sidebar is not active */}
          <div className={`flex items-center gap-2 ${showSidebar ? 'lg:hidden' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              SIQ
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base">
              Support<span className="text-indigo-600">IQ</span>
            </span>
          </div>
        </div>

        {/* Middle: Active Session Indicator Banner (only when logged in) */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Session:</span>
            <strong className="text-slate-800">{currentUser.name}</strong>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Right: User Profile or Sign In / Register */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <Avatar
                  src={currentUser.avatar}
                  name={currentUser.name}
                  className="w-7 h-7"
                />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    {getRoleIcon(currentUser.role)}
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showRoleDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRoleDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {currentUser.email}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {getRoleIcon(currentUser.role)}
                        <span>{currentUser.role} Role</span>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowRoleDropdown(false);
                            navigate('/users');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 flex items-center gap-2 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Team &amp; Users</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleDropdown(false);
                          navigate('/knowledge-base');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>Help Articles</span>
                      </button>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
