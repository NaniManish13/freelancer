import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { clientService } from '../services/clientService';
import { Project, Client } from '../types';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusAlert } from '../components/ui/StatusAlert';
import { ProjectProgressBar } from '../components/projects/ProjectProgressBar';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Users,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { success, error } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');

  // Add Project Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    status: 'ACTIVE',
    budget: 5000,
    hourlyRate: 75,
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
  });

  const fetchProjects = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await projectService.getProjects({
        status: statusFilter || undefined,
        client: clientFilter || undefined,
        search: search || undefined,
      });
      setProjects(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
      if (data.length > 0 && !formData.clientId) {
        setFormData((prev) => ({
          ...prev,
          clientId: data[0]._id,
          hourlyRate: data[0].defaultHourlyRate || 75,
        }));
      }
    } catch (err) {
      console.error('Error fetching clients for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchProjects();

    const handleDataUpdate = () => fetchProjects();
    window.addEventListener('freelanceflow:data-updated', handleDataUpdate);
    return () => window.removeEventListener('freelanceflow:data-updated', handleDataUpdate);
  }, [search, statusFilter, clientFilter]);

  const handleClientChange = (clientId: string) => {
    const selected = clients.find((c) => c._id === clientId);
    setFormData((prev) => ({
      ...prev,
      clientId,
      hourlyRate: selected?.defaultHourlyRate || prev.hourlyRate,
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      error('Please select or create a client first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await projectService.createProject({
        client: formData.clientId,
        name: formData.name,
        description: formData.description,
        status: formData.status as any,
        budget: Number(formData.budget),
        hourlyRate: Number(formData.hourlyRate),
        startDate: formData.startDate || undefined,
        deadline: formData.deadline || undefined,
      });
      success(`Project "${created.name}" created!`);
      setIsAddModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create project');
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time burn-rate monitoring, hourly project budgets, and task sprint progress.
          </p>
        </div>

        <button
          id="btn-add-project"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-projects"
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            id="select-project-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="PAUSED">Paused</option>
          </select>

          {/* Client Filter */}
          <select
            id="select-project-client"
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

      {/* Projects List Grid */}
      {loading ? (
        <LoadingSpinner label="Loading projects..." />
      ) : errorMessage ? (
        <StatusAlert message={errorMessage} onRetry={fetchProjects} />
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">No projects found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a project to define budgets, track hours, and manage task sprints.
            </p>
          </div>
          <button
            id="btn-empty-add-project"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const clientName = typeof proj.client === 'object' ? proj.client.name : 'Client';
            const currency = typeof proj.client === 'object' ? proj.client.currency : 'USD';

            return (
              <div
                key={proj._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Client & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 truncate flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {clientName}
                    </span>
                    <StatusBadge status={proj.status} size="sm" />
                  </div>

                  {/* Title & Description */}
                  <div className="mt-2">
                    <Link
                      to={`/projects/${proj._id}`}
                      className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors"
                    >
                      {proj.name}
                    </Link>
                    {proj.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {proj.description}
                      </p>
                    )}
                  </div>

                  {/* Rate & Dates */}
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span>
                      Rate: <strong className="text-slate-800">${proj.hourlyRate}/hr</strong>
                    </span>
                    {proj.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Due {new Date(proj.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Progress & Burn Rate */}
                  <div className="mt-4">
                    <ProjectProgressBar
                      calculations={proj.calculations}
                      budget={proj.budget}
                      currency={currency}
                      showDetails={true}
                    />
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Tasks: <strong>{proj.calculations?.completedTasks || 0} / {proj.calculations?.totalTasks || 0}</strong>
                  </span>
                  <Link
                    to={`/projects/${proj._id}`}
                    className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View Project <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      <Modal
        id="modal-add-project"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Project"
        subtitle="Set up project scope, hourly rate, and budget threshold."
        maxWidth="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Client *
            </label>
            {clients.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                Please <Link to="/clients" className="underline font-bold">add a client</Link> first before creating a project.
              </div>
            ) : (
              <select
                id="input-project-client"
                required
                value={formData.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''} - Default ${c.defaultHourlyRate}/hr
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Name *
            </label>
            <input
              id="input-project-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. E-Commerce Replatforming & API"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="input-project-description"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key deliverables, tech stack, and scope..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hourly Billing Rate ($) *
              </label>
              <input
                id="input-project-rate"
                type="number"
                min="0"
                step="5"
                required
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Total Budget ($) *
              </label>
              <input
                id="input-project-budget"
                type="number"
                min="0"
                step="100"
                required
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                id="input-project-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Deadline
              </label>
              <input
                id="input-project-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="btn-cancel-project"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-project"
              type="submit"
              disabled={isSubmitting || clients.length === 0}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
