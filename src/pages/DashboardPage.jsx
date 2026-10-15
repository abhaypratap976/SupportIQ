import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CustomerDashboardView } from '../components/dashboard/CustomerDashboardView';
import { AgentDashboardView } from '../components/dashboard/AgentDashboardView';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';

export function DashboardPage() {
  const { currentUser, isCustomer, isAdmin } = useAuth();

  // 1. Customer: Personalized self-service portal, my tickets, FAQ guides
  if (isCustomer || currentUser?.role === 'Customer') {
    return <CustomerDashboardView />;
  }

  // 2. Admin: Executive command center, team capacity, system triage, audit & analytics
  if (isAdmin || currentUser?.role === 'Admin') {
    return <AdminDashboardView />;
  }

  // 3. Agent: Live queue workbench, claim unassigned tickets, urgent SLAs
  return <AgentDashboardView />;
}
