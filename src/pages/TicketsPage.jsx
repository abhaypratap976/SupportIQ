import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTickets } from '../context/TicketContext';
import { useAuth } from '../context/AuthContext';
import { TicketFilterBar } from '../components/tickets/TicketFilterBar';
import { TicketList } from '../components/tickets/TicketList';
import { CreateTicketModal } from '../components/tickets/CreateTicketModal';
import { PlusCircle, TicketCheck, RefreshCw } from 'lucide-react';

export function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    filteredTickets, 
    setStatusFilter, 
    setPriorityFilter, 
    setSortBy,
    clearFilters 
  } = useTickets();
  const { isCustomer } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sync query params from URL (e.g. from dashboard cards)
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const sortParam = searchParams.get('sort');
    const actionParam = searchParams.get('action');

    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (priorityParam) {
      setPriorityFilter(priorityParam);
    }
    if (sortParam) {
      setSortBy(sortParam);
    }
    if (actionParam === 'new') {
      setIsCreateModalOpen(true);
      // Clean up param
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setStatusFilter, setPriorityFilter, setSortBy, setSearchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <TicketCheck className="w-6 h-6 text-indigo-600" />
              <span>{isCustomer ? 'My Tickets' : 'All Tickets'}</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {filteredTickets.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isCustomer
              ? 'View, search, and track the status of your requests.'
              : 'Manage ticket priorities, assign agents, and reply to customer inquiries.'}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow transition-all group self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>+ New Ticket</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <TicketFilterBar />

      {/* Main List Table */}
      <TicketList onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
