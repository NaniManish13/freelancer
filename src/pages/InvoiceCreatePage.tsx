import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { timeLogService } from '../services/timeLogService';
import { invoiceService } from '../services/invoiceService';
import { Client, TimeLog, InvoiceItem } from '../types';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  FileText,
  ArrowLeft,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Clock,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export const InvoiceCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [unbilledLogs, setUnbilledLogs] = useState<TimeLog[]>([]);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [loadingClients, setLoadingClients] = useState<boolean>(true);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 14 days net payment default
    return d.toISOString().split('T')[0];
  });
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState<string>('Thank you for your business. Payment due within 14 days.');

  // Custom Items
  const [customItems, setCustomItems] = useState<InvoiceItem[]>([]);

  // Fetch initial clients
  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const data = await clientService.getClients();
        setClients(data);
        if (data.length > 0) {
          setSelectedClientId(data[0]._id);
        }
      } catch (err) {
        error('Failed to load clients');
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  // When selected client changes, fetch their unbilled time logs
  useEffect(() => {
    if (!selectedClientId) return;
    const fetchUnbilled = async () => {
      setLoadingLogs(true);
      try {
        // Fetch unbilled logs for all projects of this client
        const logs = await timeLogService.getTimeLogs({
          isBilled: 'false',
        });
        // Filter logs where the project's client matches selectedClientId
        const clientLogs = logs.filter((l) => {
          if (typeof l.project === 'object' && l.project.client) {
            const cId = typeof l.project.client === 'object' ? l.project.client._id : l.project.client;
            return cId === selectedClientId;
          }
          return false;
        });

        setUnbilledLogs(clientLogs);
        // By default select all unbilled logs
        setSelectedLogIds(clientLogs.map((l) => l._id));
      } catch (err) {
        console.error('Error fetching unbilled logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchUnbilled();
  }, [selectedClientId]);

  const toggleSelectLog = (id: string) => {
    if (selectedLogIds.includes(id)) {
      setSelectedLogIds(selectedLogIds.filter((logId) => logId !== id));
    } else {
      setSelectedLogIds([...selectedLogIds, id]);
    }
  };

  const selectAllLogs = () => {
    if (selectedLogIds.length === unbilledLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(unbilledLogs.map((l) => l._id));
    }
  };

  const addCustomItem = () => {
    setCustomItems([
      ...customItems,
      {
        description: 'Design & Code Milestone Delivery',
        hours: 1,
        rate: 150,
        amount: 150,
      },
    ]);
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(customItems.filter((_, idx) => idx !== index));
  };

  const updateCustomItem = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...customItems];
    const item = { ...updated[index], [field]: val };
    if (field === 'hours' || field === 'rate') {
      const h = field === 'hours' ? Number(val) : Number(item.hours);
      const r = field === 'rate' ? Number(val) : Number(item.rate);
      item.amount = Math.round(h * r * 100) / 100;
    }
    updated[index] = item;
    setCustomItems(updated);
  };

  // Convert selected time logs into invoice items
  const logItems: InvoiceItem[] = unbilledLogs
    .filter((l) => selectedLogIds.includes(l._id))
    .map((l) => {
      const projName = typeof l.project === 'object' ? l.project.name : 'Project';
      const hours = Math.round((l.durationMinutes / 60) * 100) / 100;
      return {
        description: `${projName}: ${l.description || 'Sprint development work'}`,
        hours,
        rate: l.hourlyRate,
        amount: l.amount || Math.round(hours * l.hourlyRate * 100) / 100,
        timeLogId: l._id,
      };
    });

  const allItems: InvoiceItem[] = [...logItems, ...customItems];

  const subtotal = allItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const tax = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      error('Please select a client');
      return;
    }
    if (allItems.length === 0) {
      error('Please select at least one time log or add a custom line item');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdInvoice = await invoiceService.createInvoice({
        clientId: selectedClientId,
        items: allItems,
        taxRate,
        issueDate,
        dueDate,
        notes,
        timeLogIds: selectedLogIds,
      });

      success(`Invoice #${createdInvoice.invoiceNumber} created successfully!`);
      navigate(`/invoices/${createdInvoice._id}`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingClients) {
    return <LoadingSpinner label="Preparing invoice generator..." fullHeight />;
  }

  const selectedClient = clients.find((c) => c._id === selectedClientId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create New Invoice</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select client unbilled time logs, review line items, and generate a standardized billing invoice.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Client & Dates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            Client & Dates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Client *
              </label>
              {clients.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  No clients found. Please create a client first.
                </div>
              ) : (
                <select
                  id="select-invoice-client"
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Date *
              </label>
              <input
                id="input-invoice-issuedate"
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date *
              </label>
              <input
                id="input-invoice-duedate"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Unbilled Time Logs Selection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Unbilled Time Logs ({selectedLogIds.length} / {unbilledLogs.length} selected)
            </h2>

            {unbilledLogs.length > 0 && (
              <button
                type="button"
                onClick={selectAllLogs}
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                {selectedLogIds.length === unbilledLogs.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {loadingLogs ? (
            <LoadingSpinner label="Fetching unbilled hours..." />
          ) : unbilledLogs.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
              No unbilled time logs found for {selectedClient?.name || 'this client'}. You can still add custom line items below.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {unbilledLogs.map((log) => {
                const isSelected = selectedLogIds.includes(log._id);
                const projName = typeof log.project === 'object' ? log.project.name : 'Project';
                const hours = (log.durationMinutes / 60).toFixed(2);

                return (
                  <div
                    key={log._id}
                    onClick={() => toggleSelectLog(log._id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-blue-600">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {projName} • <span className="font-normal text-slate-600">{log.description || 'Sprint task'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(log.startTime).toLocaleDateString()} • {hours}h @ ${log.hourlyRate}/hr
                        </div>
                      </div>
                    </div>

                    <div className="font-bold text-xs text-emerald-700">
                      ${(log.amount || 0).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Custom Line Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                3
              </span>
              Additional Line Items (Fixed Fee / Milestones)
            </h2>

            <button
              id="btn-add-custom-item"
              type="button"
              onClick={addCustomItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line Item
            </button>
          </div>

          {customItems.length === 0 ? (
            <p className="text-xs text-slate-400">No additional custom line items added.</p>
          ) : (
            <div className="space-y-3">
              {customItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateCustomItem(idx, 'description', e.target.value)}
                      placeholder="e.g. Design review & consultation"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Hours / Qty
                    </label>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={item.hours}
                      onChange={(e) => updateCustomItem(idx, 'hours', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Rate ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={item.rate}
                      onChange={(e) => updateCustomItem(idx, 'rate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Total
                    </label>
                    <span className="font-bold text-xs text-slate-900 block py-1.5">
                      ${(item.amount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="sm:col-span-1 text-right pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => removeCustomItem(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Tax, Notes & Financial Totals */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
              4
            </span>
            Invoice Summary & Calculation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes & Terms */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tax Rate (%)
                </label>
                <input
                  id="input-invoice-taxrate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full max-w-xs px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Invoice Notes / Payment Terms
                </label>
                <textarea
                  id="input-invoice-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Price Breakdown Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Line Items Subtotal:</span>
                  <span className="font-semibold text-slate-900">${subtotal.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Sales Tax ({taxRate}%):</span>
                  <span className="font-semibold text-slate-900">${tax.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Total Due:</span>
                  <span className="text-2xl font-black text-blue-600">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  id="btn-submit-create-invoice"
                  type="submit"
                  disabled={isSubmitting || allItems.length === 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? 'Creating & Linking Logs...' : 'Generate Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
