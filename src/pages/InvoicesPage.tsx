import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { clientService } from '../services/clientService';
import { Invoice, Client } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { UpgradeModal } from '../components/ui/UpgradeModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusAlert } from '../components/ui/StatusAlert';
import {
  FileText,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Calendar,
  DollarSign,
  ExternalLink,
  Printer,
  Sparkles,
  Zap,
  Clock,
  Layers,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');

  // Pro Upgrade Trigger Modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await invoiceService.getInvoices({
        status: statusFilter || undefined,
        client: clientFilter || undefined,
        search: search || undefined,
      });
      setInvoices(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchInvoices();

    const handleDataUpdate = () => fetchInvoices();
    window.addEventListener('freelanceflow:data-updated', handleDataUpdate);
    return () => window.removeEventListener('freelanceflow:data-updated', handleDataUpdate);
  }, [search, statusFilter, clientFilter]);

  const handleDownloadPdf = async (invoice: Invoice) => {
    if (user?.plan !== 'PRO') {
      setUpgradeReason(
        'Puppeteer High-Resolution PDF invoice generation is a PRO feature. Upgrade to unlock direct PDF downloads!'
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    setDownloadingId(invoice._id);
    try {
      await invoiceService.downloadPdf(invoice._id, invoice.invoiceNumber);
      success(`Downloaded Invoice #${invoice.invoiceNumber}.pdf`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to generate PDF invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await invoiceService.updateInvoice(invoice._id, { status: 'PAID' });
      success(`Invoice #${invoice.invoiceNumber} marked as PAID!`);
      fetchInvoices();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update invoice status');
    }
  };

  // Aggregated totals for filtered invoices
  const totalBilled = invoices.reduce((acc, i) => acc + (i.total || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const totalPaid = paidInvoices.reduce((acc, i) => acc + (i.total || 0), 0);
  const pendingInvoices = invoices.filter((i) => ['SENT', 'DRAFT', 'OVERDUE'].includes(i.status));
  const totalPending = pendingInvoices.reduce((acc, i) => acc + (i.total || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {invoices.length} {invoices.length === 1 ? 'Invoice' : 'Invoices'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate itemized client invoices from logged hours, generate PDFs, and track settlements.
          </p>
        </div>

        <Link
          id="btn-new-invoice-wizard"
          to="/invoices/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Invoiced</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">${totalBilled.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Paid Volume</span>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">${totalPaid.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Outstanding / Pending</span>
            <div className="text-xl font-bold text-amber-600 mt-0.5">${totalPending.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-invoices"
            type="text"
            placeholder="Search by invoice number or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            id="select-invoice-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Client Filter */}
          <select
            id="select-invoice-client"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading invoices..." />
        ) : errorMessage ? (
          <StatusAlert message={errorMessage} onRetry={fetchInvoices} />
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-4">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">No invoices found</h3>
              <p className="mt-1 max-w-sm mx-auto">
                Generate an invoice from unbilled logged hours to bill clients and collect payments.
              </p>
            </div>
            <Link
              to="/invoices/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Your First Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Subtotal</th>
                  <th className="py-3 px-4">Tax</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const clientName = typeof inv.client === 'object' ? inv.client.name : 'Client';
                  const isDownloading = downloadingId === inv._id;

                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-blue-600 whitespace-nowrap">
                        <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {clientName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        ${(inv.subtotal || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        ${(inv.tax || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                        ${(inv.total || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Mark as Paid Quick Action */}
                          {inv.status !== 'PAID' && (
                            <button
                              id={`btn-mark-paid-${inv._id}`}
                              onClick={() => handleMarkAsPaid(inv)}
                              title="Mark as Paid"
                              className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                            >
                              Mark Paid
                            </button>
                          )}

                          {/* PDF Download Button */}
                          <button
                            id={`btn-pdf-invoice-${inv._id}`}
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={isDownloading}
                            title={user?.plan === 'PRO' ? 'Download PDF' : 'PDF requires PRO plan'}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* View Detail */}
                          <Link
                            to={`/invoices/${inv._id}`}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Invoice"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upgrade Modal for PDF feature */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason={upgradeReason}
      />
    </div>
  );
};
