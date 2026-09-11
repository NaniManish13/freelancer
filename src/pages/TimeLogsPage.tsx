import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { timeLogService } from '../services/timeLogService';
import { projectService } from '../services/projectService';
import { TimeLog, Project } from '../types';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calendar,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  FolderKanban,
  FileText,
  Filter,
} from 'lucide-react';

export const TimeLogsPage: React.FC = () => {
  const { success, error } = useToast();

  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [isBilledFilter, setIsBilledFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    projectId: '',
    durationMinutes: 60,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchTimeLogs = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await timeLogService.getTimeLogs({
        project: selectedProject || undefined,
        isBilled: isBilledFilter !== '' ? isBilledFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTimeLogs(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load time logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
      if (data.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchTimeLogs();

    const handleDataUpdate = () => fetchTimeLogs();
    window.addEventListener('freelanceflow:data-updated', handleDataUpdate);
    return () => window.removeEventListener('freelanceflow:data-updated', handleDataUpdate);
  }, [selectedProject, isBilledFilter, startDate, endDate]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId && !editingLog) {
      error('Please select a project');
      return;
    }

    setIsSubmitting(true);
    const start = new Date(formData.date);
    const end = new Date(start.getTime() + formData.durationMinutes * 60 * 1000);

    try {
      if (editingLog) {
        await timeLogService.updateTimeLog(editingLog._id, {
          durationMinutes: formData.durationMinutes,
          description: formData.description,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        });
        success('Time log updated successfully');
      } else {
        await timeLogService.createTimeLog({
          projectId: formData.projectId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          description: formData.description || 'Manual entry',
        });
        success(`Logged ${formData.durationMinutes} minutes successfully!`);
      }

      setIsAddModalOpen(false);
      setEditingLog(null);
      setFormData({
        projectId: projects[0]?._id || '',
        durationMinutes: 60,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchTimeLogs();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save time log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLogId) return;
    setIsSubmitting(true);
    try {
      await timeLogService.deleteTimeLog(deletingLogId);
      success('Time log deleted');
      setDeletingLogId(null);
      fetchTimeLogs();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete time log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (log: TimeLog) => {
    setEditingLog(log);
    setFormData({
      projectId: typeof log.project === 'object' ? log.project._id : log.project,
      durationMinutes: log.durationMinutes,
      description: log.description || '',
      date: log.startTime ? log.startTime.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsAddModalOpen(true);
  };

  // Calculations for filtered logs
  const totalMinutes = timeLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalAmount = timeLogs.reduce((acc, l) => acc + (l.amount || 0), 0);
  const unbilledLogs = timeLogs.filter((l) => !l.isBilled);
  const unbilledAmount = unbilledLogs.reduce((acc, l) => acc + (l.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Time Logs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {timeLogs.length} Entries
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete record of logged hours, billable amounts, and invoice assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unbilledLogs.length > 0 && (
            <Link
              id="btn-invoice-unbilled-logs"
              to="/invoices/create"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" /> Invoice Unbilled (${unbilledAmount.toLocaleString()})
            </Link>
          )}

          <button
            id="btn-add-manual-log"
            onClick={() => {
              setEditingLog(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Hours
          </button>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Time Logged</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{totalHours} Hours</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Value</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">${totalAmount.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Unbilled Work</span>
            <div className="text-xl font-bold text-amber-600 mt-0.5">
              ${unbilledAmount.toLocaleString()} ({unbilledLogs.length} logs)
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project Filter */}
          <select
            id="filter-log-project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Billing Filter */}
          <select
            id="filter-log-billing"
            value={isBilledFilter}
            onChange={(e) => setIsBilledFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Billing Statuses</option>
            <option value="false">Unbilled Only</option>
            <option value="true">Billed Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Date Range:</span>
          <input
            id="filter-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
          <span>to</span>
          <input
            id="filter-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
          {(startDate || endDate || selectedProject || isBilledFilter) && (
            <button
              onClick={() => {
                setSelectedProject('');
                setIsBilledFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Time Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading time logs..." />
        ) : errorMessage ? (
          <ErrorMessage message={errorMessage} onRetry={fetchTimeLogs} />
        ) : timeLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No time logs found matching the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timeLogs.map((log) => {
                  const projName = typeof log.project === 'object' ? log.project.name : 'Project';
                  const projId = typeof log.project === 'object' ? log.project._id : log.project;
                  const hours = Math.floor(log.durationMinutes / 60);
                  const mins = log.durationMinutes % 60;

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <Link to={`/projects/${projId}`} className="hover:text-blue-600">
                          {projName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {log.description || 'Sprint deliverables'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {hours > 0 ? `${hours}h ` : ''}{mins}m
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        ${log.hourlyRate}/hr
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700 whitespace-nowrap">
                        ${(log.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {log.isBilled ? (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                            Billed (Invoice #{typeof log.invoice === 'object' ? log.invoice.invoiceNumber : 'Linked'})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                            Unbilled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-log-${log._id}`}
                            onClick={() => openEditModal(log)}
                            disabled={log.isBilled}
                            title={log.isBilled ? 'Cannot edit billed log' : 'Edit Log'}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-log-${log._id}`}
                            onClick={() => setDeletingLogId(log._id)}
                            disabled={log.isBilled}
                            title={log.isBilled ? 'Cannot delete billed log' : 'Delete Log'}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Manual / Edit Time Log Modal */}
      <Modal
        id="modal-add-edit-timelog"
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLog(null);
        }}
        title={editingLog ? 'Edit Time Log' : 'Log Work Session'}
        subtitle="Specify project, duration in minutes, and sprint notes."
        maxWidth="md"
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          {!editingLog && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Project *
              </label>
              {projects.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  Please create a project first.
                </div>
              ) : (
                <select
                  id="input-timelog-proj"
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (${p.hourlyRate}/hr)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration (Minutes) *
              </label>
              <input
                id="input-timelog-duration"
                type="number"
                min="1"
                step="15"
                required
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                = {(formData.durationMinutes / 60).toFixed(2)} hours
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Work *
              </label>
              <input
                id="input-timelog-date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Work Description
            </label>
            <textarea
              id="input-timelog-description"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Completed client sprint review and deployed hotfix"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="btn-cancel-timelog-modal"
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingLog(null);
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-timelog-modal"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingLog ? 'Update Log' : 'Save Time Log'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        id="dialog-delete-timelog"
        isOpen={Boolean(deletingLogId)}
        onClose={() => setDeletingLogId(null)}
        onConfirm={handleDelete}
        title="Delete Time Log"
        message="Are you sure you want to delete this time entry? This will adjust project spent metrics."
        confirmLabel="Delete Entry"
        isLoading={isSubmitting}
      />
    </div>
  );
};
