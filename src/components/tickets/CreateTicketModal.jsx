import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, PRIORITIES } from '../../data/seedData';
import { Send, AlertCircle } from 'lucide-react';

export function CreateTicketModal({ isOpen, onClose, onCreated }) {
  const { createTicket } = useTickets();
  const { currentUser, availableUsers, isCustomer } = useAuth();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical Issue');
  const [priority, setPriority] = useState('Medium');
  
  // Requester fields
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterCompany, setRequesterCompany] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Assigned Agent (for staff)
  const [assignedAgentId, setAssignedAgentId] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available customers and agents from demo users
  const customerList = availableUsers.filter(u => u.role === 'Customer');
  const agentList = availableUsers.filter(u => u.role === 'Agent' || u.role === 'Admin');

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setDescription('');
      setCategory('Technical Issue');
      setPriority('Medium');
      setErrors({});

      if (isCustomer) {
        setRequesterName(currentUser.name);
        setRequesterEmail(currentUser.email);
        setRequesterCompany(currentUser.company || '');
        setSelectedCustomerId(currentUser.id);
        setAssignedAgentId('');
      } else {
        // Default to first customer
        const defaultCust = customerList[0];
        if (defaultCust) {
          setSelectedCustomerId(defaultCust.id);
          setRequesterName(defaultCust.name);
          setRequesterEmail(defaultCust.email);
          setRequesterCompany(defaultCust.company || '');
        }
        setAssignedAgentId('');
      }
    }
  }, [isOpen, isCustomer, currentUser]);

  const handleCustomerSelect = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    const found = customerList.find(c => c.id === custId);
    if (found) {
      setRequesterName(found.name);
      setRequesterEmail(found.email);
      setRequesterCompany(found.company || '');
    }
  };

  const validate = () => {
    const errs = {};
    if (!subject.trim()) {
      errs.subject = 'Subject is required';
    } else if (subject.trim().length < 5) {
      errs.subject = 'Subject should be at least 5 characters';
    }

    if (!description.trim()) {
      errs.description = 'Please provide details describing the issue';
    } else if (description.trim().length < 10) {
      errs.description = 'Description should be at least 10 characters';
    }

    if (!requesterName.trim()) {
      errs.requesterName = 'Customer name is required';
    }

    if (!requesterEmail.trim()) {
      errs.requesterEmail = 'Customer email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail.trim())) {
      errs.requesterEmail = 'Please enter a valid email address';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const assignedTo = assignedAgentId
        ? agentList.find(a => a.id === assignedAgentId)
        : null;

      const newTicket = createTicket({
        subject,
        description,
        category,
        priority,
        requester: {
          name: requesterName,
          email: requesterEmail,
          company: requesterCompany
        },
        assignedTo
      });

      onClose();
      if (onCreated) {
        onCreated(newTicket);
      }
    } catch {
      // Error handled by ToastContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCustomer ? 'New Support Ticket' : 'Create New Ticket'}
      subtitle={isCustomer ? 'We typically reply within a few hours.' : 'Create and assign a support ticket.'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Requester Section */}
        {!isCustomer ? (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Customer Information
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerSelect}
                  className="w-full h-10 pl-3.5 pr-8 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-xs transition-all"
                >
                  {customerList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || c.email})
                    </option>
                  ))}
                  <option value="custom">-- Custom Customer --</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Email *
                </label>
                <input
                  type="email"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  className={`w-full h-10 px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-xs transition-all ${
                    errors.requesterEmail
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                  placeholder="name@company.com"
                />
                {errors.requesterEmail && (
                  <p className="text-xs text-rose-600 mt-1">{errors.requesterEmail}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-indigo-900">Submitting as: </span>
              <span className="text-indigo-700 font-medium">{currentUser.name} ({currentUser.email})</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-white text-indigo-700 font-semibold shadow-xs">
              {currentUser.company || 'Customer'}
            </span>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`w-full h-10 px-3.5 py-2 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-xs transition-all ${
              errors.subject
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
            placeholder="Brief summary of the issue (e.g. Unable to connect via API webhook)"
          />
          {errors.subject && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.subject}
            </p>
          )}
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 pl-3.5 pr-8 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-xs transition-all"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Priority *
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full h-10 pl-3.5 pr-8 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-xs transition-all"
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assigned to (only for staff) */}
        {!isCustomer && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned to (Optional)
            </label>
            <select
              value={assignedAgentId}
              onChange={(e) => setAssignedAgentId(e.target.value)}
              className="w-full h-10 pl-3.5 pr-8 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-xs transition-all"
            >
              <option value="">Unassigned</option>
              {agentList.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.title || a.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description *
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none shadow-xs transition-all ${
              errors.description
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            }`}
            placeholder="Please share steps to reproduce, expected vs actual behavior, or error messages..."
          />
          {errors.description && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="sticky -bottom-5 bg-white pt-4 pb-2 border-t border-slate-100 flex items-center justify-end gap-3 z-10">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            icon={Send}
          >
            {isCustomer ? 'Submit Ticket' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
