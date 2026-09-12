import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { Client, Project, Invoice } from '../types';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusAlert } from '../components/ui/StatusAlert';
import { ProjectProgressBar } from '../components/projects/ProjectProgressBar';
import {
  Users,
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FolderKanban,
  FileText,
  Plus,
  Building2,
  Calendar,
} from 'lucide-react';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [clientData, setClientData] = useState<
    (Client & { projects?: Project[]; invoices?: Invoice[] }) | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
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

  const fetchClient = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await clientService.getClientById(id);
      setClientData(data);
      setFormData({
        name: data.name,
        companyName: data.companyName || '',
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        defaultHourlyRate: data.defaultHourlyRate,
        currency: data.currency || 'USD',
      });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await clientService.updateClient(id, formData);
      success('Client updated successfully');
      setIsEditModalOpen(false);
      fetchClient();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await clientService.deleteClient(id);
      success('Client removed successfully');
      navigate('/clients');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete client');
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading client details..." fullHeight />;
  }

  if (errorMessage || !clientData) {
    return <StatusAlert message={errorMessage || 'Client not found'} onRetry={fetchClient} />;
  }

  const projects = clientData.projects || [];
  const invoices = clientData.invoices || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>

        <div className="flex items-center gap-2">
          <button
            id="btn-edit-client"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Client
          </button>
          <button
            id="btn-delete-client"
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Main Client Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
            {clientData.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{clientData.name}</h1>
            {clientData.companyName && (
              <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {clientData.companyName}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {clientData.email}
              </span>
              {clientData.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {clientData.phone}
                </span>
              )}
              {clientData.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {clientData.address}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rates & Overview */}
        <div className="flex flex-row md:flex-col justify-between md:items-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 block">Default Hourly Rate</span>
            <span className="text-xl font-black text-emerald-700">
              ${clientData.defaultHourlyRate} <span className="text-xs text-slate-500 font-normal">/ hr ({clientData.currency})</span>
            </span>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 block">Client Since</span>
            <span className="text-xs font-semibold text-slate-700">
              {new Date(clientData.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Projects ({projects.length})</h2>
            <p className="text-xs text-slate-500">Assigned client contracts & deliverables</p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No projects associated with this client yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj._id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/projects/${proj._id}`}
                      className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {proj.name}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Rate: ${proj.hourlyRate}/hr • Budget: ${proj.budget.toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={proj.status} size="sm" />
                </div>

                {proj.calculations && (
                  <ProjectProgressBar
                    calculations={proj.calculations}
                    budget={proj.budget}
                    currency={clientData.currency}
                    showDetails={false}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Invoices ({invoices.length})</h2>
            <p className="text-xs text-slate-500">Billing history and payment records</p>
          </div>
          <Link
            to={`/invoices/create`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> Invoice Client
          </Link>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            No invoices generated for this client yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Issue Date</th>
                  <th className="pb-2.5">Due Date</th>
                  <th className="pb-2.5">Total Amount</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-bold text-blue-600">
                      <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      ${(inv.total || 0).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="font-bold text-blue-600 hover:text-blue-700"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      <Modal
        id="modal-edit-client"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client"
        subtitle="Update client contact, company info, and hourly billing rates."
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Client Contact Name *
            </label>
            <input
              id="edit-client-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Company Name (Optional)
            </label>
            <input
              id="edit-client-company"
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <input
                id="edit-client-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                id="edit-client-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                id="edit-client-rate"
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
                id="edit-client-currency"
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
              id="edit-client-address"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="btn-cancel-edit-client"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-edit-client"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        id="dialog-delete-client"
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete ${clientData.name}? This will permanently remove the client and their associated projects/time logs.`}
        confirmLabel="Delete Client"
        isLoading={isDeleting}
      />
    </div>
  );
};
