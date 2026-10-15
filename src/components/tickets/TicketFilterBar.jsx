import React from 'react';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, STATUSES, PRIORITIES } from '../../data/seedData';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';

export function TicketFilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    assigneeFilter,
    setAssigneeFilter,
    sortBy,
    setSortBy,
    clearFilters
  } = useTickets();

  const { availableUsers, isCustomer } = useAuth();
  const agentList = availableUsers.filter(u => u.role === 'Agent' || u.role === 'Admin');

  const hasActiveFilters = 
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    priorityFilter !== 'All' ||
    categoryFilter !== 'All' ||
    assigneeFilter !== 'All';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
      {/* Top row: Search input & Sorting */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isCustomer ? "Search your tickets by subject or ticket ID..." : "Search tickets by subject, requester, or ID..."}
            className="w-full h-10 pl-10 pr-8 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 text-xs sm:text-sm font-medium rounded-xl border border-slate-300 bg-white text-slate-800 py-2 pl-3.5 pr-8 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-xs transition-all"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="priority">Sort: Highest Priority</option>
            <option value="updated">Sort: Recently Updated</option>
          </select>
        </div>
      </div>

      {/* Bottom row: Filter Dropdowns & Clear Button */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`h-9 text-xs font-medium rounded-lg border py-1.5 pl-2.5 pr-8 focus:outline-none transition-all ${
            statusFilter !== 'All' 
              ? 'border-indigo-300 bg-indigo-50/50 text-indigo-900 font-semibold focus:ring-2 focus:ring-indigo-500/20' 
              : 'border-slate-300 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          }`}
        >
          <option value="All">Status: All</option>
          {STATUSES.map(s => {
            let label = s;
            if (isCustomer) {
              if (s === 'Waiting for Customer') label = 'Awaiting Your Reply';
              else if (s === 'In Progress') label = 'In Progress (Under Review)';
              else if (s === 'Open') label = 'Open (Submitted)';
              else if (s === 'Resolved') label = 'Resolved (Closed)';
            }
            return (
              <option key={s} value={s}>{label}</option>
            );
          })}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className={`h-9 text-xs font-medium rounded-lg border py-1.5 pl-2.5 pr-8 focus:outline-none transition-all ${
            priorityFilter !== 'All' 
              ? 'border-indigo-300 bg-indigo-50/50 text-indigo-900 font-semibold focus:ring-2 focus:ring-indigo-500/20' 
              : 'border-slate-300 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          }`}
        >
          <option value="All">Priority: All</option>
          {PRIORITIES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`h-9 text-xs font-medium rounded-lg border py-1.5 pl-2.5 pr-8 focus:outline-none transition-all ${
            categoryFilter !== 'All' 
              ? 'border-indigo-300 bg-indigo-50/50 text-indigo-900 font-semibold focus:ring-2 focus:ring-indigo-500/20' 
              : 'border-slate-300 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
          }`}
        >
          <option value="All">Category: All</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Assignee Filter (Hidden for customers) */}
        {!isCustomer && (
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className={`h-9 text-xs font-medium rounded-lg border py-1.5 pl-2.5 pr-8 focus:outline-none transition-all ${
              assigneeFilter !== 'All' 
                ? 'border-indigo-300 bg-indigo-50/50 text-indigo-900 font-semibold focus:ring-2 focus:ring-indigo-500/20' 
                : 'border-slate-300 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
          >
            <option value="All">Assigned to: All Agents</option>
            <option value="Unassigned">Assigned to: Unassigned</option>
            {agentList.map(a => (
              <option key={a.id} value={a.id}>Assigned to: {a.name}</option>
            ))}
          </select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors ml-auto flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
