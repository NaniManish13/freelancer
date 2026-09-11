import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { Client } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  ExternalLink,
  Zap,
  Building2,
  Sparkles,
} from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Client Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    defaultHourlyRate: 75,
    currency: 'USD',
  });

  const fetchClients = async (query?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await clientService.getClients(query);
      setClients(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(search);

    const handleDataUpdate = () => fetchClients(search);
    window.addEventListener('freelanceflow:data-updated', handleDataUpdate);
    return () => window.removeEventListener('freelanceflow:data-updated', handleDataUpdate);
  }, [search]);

  const handleOpenAddModal = () => {
    // Check Free Plan limit on client side as an immediate friendly prompt
    if (user?.plan === 'FREE' && clients.length >= 2) {
      setUpgradeReason(
        'Free Plan limit reached (maximum 2 clients). Upgrade to PRO for unlimited clients!'
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    setFormData({
      name: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      defaultHourlyRate: 75,
      currency: 'USD',
    });
    setIsAddModalOpen(true);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await clientService.createClient(formData);
      success(`Client "${created.name}" created successfully!`);
      setIsAddModalOpen(false);
      fetchClients(search);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create client';
      if (msg.includes('Free plan limit reached')) {
        setIsAddModalOpen(false);
        setUpgradeReason(msg);
        setIsUpgradeModalOpen(true);
      } else {
        error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clients</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {clients.length} {clients.length === 1 ? 'Client' : 'Clients'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your client accounts, default billing rates, contacts, and historical billings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.plan === 'FREE' && (
            <div className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              Free Plan: <strong>{clients.length}/2 clients used</strong>
            </div>
          )}
          <button
            id="btn-add-client"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-clients"
            type="text"
            placeholder="Search by client name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <LoadingSpinner label="Loading clients..." />
      ) : errorMessage ? (
        <ErrorMessage message={errorMessage} onRetry={() => fetchClients(search)} />
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">No clients found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? `No clients match the query "${search}".`
                : 'Get started by creating your first client to track projects and send invoices.'}
            </p>
          </div>
          <button
            id="btn-empty-add-client"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Your First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        to={`/clients/${client._id}`}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors"
                      >
                        {client.name}
                      </Link>
                      {client.companyName && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {client.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Rate: <strong>${client.defaultHourlyRate}/hr</strong> ({client.currency})</span>
                  </div>
                </div>
              </div>

              {/* Stats & Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-slate-400">Projects: </span>
                    <strong className="text-slate-800">{client.totalProjects || 0}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Paid: </span>
                    <strong className="text-emerald-700">${(client.totalPaid || 0).toLocaleString()}</strong>
                  </div>
                </div>

                <Link
                  to={`/clients/${client._id}`}
                  className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Details <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <Modal
        id="modal-add-client"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Client"
        subtitle="Create a client record to assign projects, track time, and issue invoices."
        maxWidth="md"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Client Contact Name *
            </label>
            <input
              id="input-client-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Company Name (Optional)
            </label>
            <input
              id="input-client-company"
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Apex Design Agency"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                id="input-client-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sarah@apexdesign.io"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                id="input-client-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Default Hourly Rate ($) *
              </label>
              <input
                id="input-client-rate"
                type="number"
                min="0"
                step="5"
                required
                value={formData.defaultHourlyRate}
                onChange={(e) => setFormData({ ...formData, defaultHourlyRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Billing Currency
              </label>
              <select
                id="input-client-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Billing Address / Notes
            </label>
            <textarea
              id="input-client-address"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Innovation Way, Suite 400, San Francisco, CA"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="btn-cancel-client"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-client"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upgrade Plan Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason={upgradeReason}
      />
    </div>
  );
};
