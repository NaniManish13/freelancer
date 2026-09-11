import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { timeLogService } from '../services/timeLogService';
import { Project, Task, TimeLog } from '../types';
import { useToast } from '../context/ToastContext';
import { useTimer } from '../context/TimerContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { ProjectProgressBar } from '../components/projects/ProjectProgressBar';
import {
  FolderKanban,
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Play,
  CheckCircle2,
  ListTodo,
  FileSpreadsheet,
  AlertCircle,
  Layers,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { startTimer } = useTimer();

  const [projectData, setProjectData] = useState<
    (Project & { tasks?: Task[]; timeLogs?: TimeLog[] }) | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'timeLogs'>('tasks');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState<boolean>(false);
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit Project Form
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    budget: 5000,
    hourlyRate: 75,
    startDate: '',
    deadline: '',
  });

  // Add Task Form
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
  });

  // Log Time Form
  const [logFormData, setLogFormData] = useState({
    taskId: '',
    durationMinutes: 60,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await projectService.getProjectById(id);
      setProjectData(data);
      setEditFormData({
        name: data.name,
        description: data.description || '',
        status: data.status,
        budget: data.budget,
        hourlyRate: data.hourlyRate,
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        deadline: data.deadline ? data.deadline.split('T')[0] : '',
      });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await projectService.updateProject(id, editFormData as any);
      success('Project updated successfully');
      setIsEditModalOpen(false);
      fetchProject();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await projectService.deleteProject(id);
      success('Project deleted successfully');
      navigate('/projects');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      await taskService.createTask({
        project: id,
        title: taskFormData.title,
        description: taskFormData.description,
        status: taskFormData.status as any,
        priority: taskFormData.priority as any,
        dueDate: taskFormData.dueDate || undefined,
      });
      success('Task created!');
      setIsAddTaskModalOpen(false);
      setTaskFormData({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
      });
      fetchProject();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus =
      task.status === 'TODO'
        ? 'IN_PROGRESS'
        : task.status === 'IN_PROGRESS'
        ? 'DONE'
        : 'TODO';

    try {
      await taskService.updateTask(task._id, { status: nextStatus });
      success(`Task marked as ${nextStatus}`);
      fetchProject();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);

    const startTime = new Date(logFormData.date);
    const endTime = new Date(startTime.getTime() + logFormData.durationMinutes * 60 * 1000);

    try {
      await timeLogService.createTimeLog({
        projectId: id,
        taskId: logFormData.taskId || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description: logFormData.description || 'Manual time entry',
      });
      success(`Logged ${logFormData.durationMinutes} minutes to project!`);
      setIsLogTimeModalOpen(false);
      setLogFormData({
        taskId: '',
        durationMinutes: 60,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchProject();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to log time');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading project details..." fullHeight />;
  }

  if (errorMessage || !projectData) {
    return <ErrorMessage message={errorMessage || 'Project not found'} onRetry={fetchProject} />;
  }

  const client = typeof projectData.client === 'object' ? projectData.client : null;
  const clientName = client ? client.name : 'Client';
  const currency = client ? client.currency : 'USD';
  const tasks = projectData.tasks || [];
  const timeLogs = projectData.timeLogs || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        <div className="flex items-center gap-2">
          <button
            id="btn-start-timer-for-project"
            onClick={() =>
              startTimer({
                projectId: projectData._id,
                projectName: projectData.name,
                clientName,
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Start Timer
          </button>
          <button
            id="btn-edit-project"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            id="btn-delete-project"
            onClick={() => setIsConfirmDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Main Project Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{projectData.name}</h1>
              <StatusBadge status={projectData.status} />
            </div>

            <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-4">
              <span>
                Client:{' '}
                {client ? (
                  <Link to={`/clients/${client._id}`} className="font-bold text-blue-600 hover:underline">
                    {client.name} {client.companyName ? `(${client.companyName})` : ''}
                  </Link>
                ) : (
                  'Unknown Client'
                )}
              </span>
              <span>Rate: <strong className="text-slate-800">${projectData.hourlyRate}/hr</strong></span>
              {projectData.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Target Deadline: <strong>{new Date(projectData.deadline).toLocaleDateString()}</strong>
                </span>
              )}
            </div>

            {projectData.description && (
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                {projectData.description}
              </p>
            )}
          </div>
        </div>

        {/* Burn Rate Progress Bar with complete breakdown */}
        <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl">
          <ProjectProgressBar
            calculations={projectData.calculations}
            budget={projectData.budget}
            currency={currency}
            showDetails={true}
          />
        </div>
      </div>

      {/* Tabs: Tasks vs Time Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <button
              id="tab-tasks"
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Tasks ({tasks.length})
            </button>

            <button
              id="tab-time-logs"
              onClick={() => setActiveTab('timeLogs')}
              className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'timeLogs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Time Logs ({timeLogs.length})
            </button>
          </div>

          <div className="pb-3">
            {activeTab === 'tasks' ? (
              <button
                id="btn-add-task-to-project"
                onClick={() => setIsAddTaskModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            ) : (
              <button
                id="btn-log-time-to-project"
                onClick={() => setIsLogTimeModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
              >
                <Clock className="w-3.5 h-3.5" /> Log Manual Hours
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'tasks' ? (
            tasks.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No tasks created for this project yet. Click "Add Task" to start breaking down milestones.
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`p-1 rounded-lg shrink-0 transition-colors ${
                          task.status === 'DONE'
                            ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50'
                            : 'text-slate-400 hover:text-slate-600 bg-white border border-slate-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <div>
                        <h4
                          className={`font-semibold text-xs sm:text-sm text-slate-900 ${
                            task.status === 'DONE' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <StatusBadge status={task.priority} size="sm" />
                      <StatusBadge status={task.status} size="sm" />
                      <button
                        onClick={() =>
                          startTimer({
                            projectId: projectData._id,
                            projectName: projectData.name,
                            taskId: task._id,
                            taskTitle: task.title,
                          })
                        }
                        title="Start timer on this task"
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            timeLogs.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No time logs recorded for this project yet. Use the stopwatch or log manual hours.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Description</th>
                      <th className="pb-2.5">Duration</th>
                      <th className="pb-2.5">Hourly Rate</th>
                      <th className="pb-2.5">Amount</th>
                      <th className="pb-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timeLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 text-slate-500">
                          {new Date(log.startTime).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-medium text-slate-800">
                          {log.description || 'Sprint work'}
                        </td>
                        <td className="py-3 font-semibold text-slate-900">
                          {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                        </td>
                        <td className="py-3 text-slate-500">${log.hourlyRate}/hr</td>
                        <td className="py-3 font-bold text-slate-900">${(log.amount || 0).toLocaleString()}</td>
                        <td className="py-3">
                          {log.isBilled ? (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                              Billed (Invoice #{typeof log.invoice === 'object' ? log.invoice.invoiceNumber : 'Linked'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                              Unbilled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      <Modal
        id="modal-edit-project"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project"
        subtitle="Update project budget, status, hourly rate, and deadlines."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Project Name *
            </label>
            <input
              id="edit-project-name"
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              id="edit-project-description"
              rows={2}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hourly Rate ($) *
              </label>
              <input
                id="edit-project-rate"
                type="number"
                min="0"
                step="5"
                required
                value={editFormData.hourlyRate}
                onChange={(e) => setEditFormData({ ...editFormData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Budget Limit ($) *
              </label>
              <input
                id="edit-project-budget"
                type="number"
                min="0"
                step="100"
                required
                value={editFormData.budget}
                onChange={(e) => setEditFormData({ ...editFormData, budget: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                id="edit-project-status"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="PAUSED">PAUSED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Deadline
              </label>
              <input
                id="edit-project-deadline"
                type="date"
                value={editFormData.deadline}
                onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="btn-cancel-edit-proj"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-edit-proj"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        id="modal-add-task"
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Add Task to Project"
        subtitle="Define sprint task, priority level, and target due date."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              id="input-task-title"
              type="text"
              required
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              placeholder="e.g. Design responsive landing hero"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="input-task-description"
              rows={2}
              value={taskFormData.description}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              placeholder="Scope specifications and Figma links..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                id="input-task-priority"
                value={taskFormData.priority}
                onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                id="input-task-duedate"
                type="date"
                value={taskFormData.dueDate}
                onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="btn-cancel-task"
              type="button"
              onClick={() => setIsAddTaskModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-task"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Manual Time Modal */}
      <Modal
        id="modal-log-time"
        isOpen={isLogTimeModalOpen}
        onClose={() => setIsLogTimeModalOpen(false)}
        title="Log Manual Hours"
        subtitle="Record past billable work for this project."
        maxWidth="md"
      >
        <form onSubmit={handleCreateManualLog} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Task (Optional)
            </label>
            <select
              id="input-log-task"
              value={logFormData.taskId}
              onChange={(e) => setLogFormData({ ...logFormData, taskId: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">General Project Work</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Duration (Minutes) *
              </label>
              <input
                id="input-log-duration"
                type="number"
                min="1"
                step="15"
                required
                value={logFormData.durationMinutes}
                onChange={(e) => setLogFormData({ ...logFormData, durationMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                = {(logFormData.durationMinutes / 60).toFixed(2)} billable hours (${((logFormData.durationMinutes / 60) * projectData.hourlyRate).toFixed(2)})
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Work *
              </label>
              <input
                id="input-log-date"
                type="date"
                required
                value={logFormData.date}
                onChange={(e) => setLogFormData({ ...logFormData, date: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Work Description
            </label>
            <textarea
              id="input-log-desc"
              rows={2}
              value={logFormData.description}
              onChange={(e) => setLogFormData({ ...logFormData, description: e.target.value })}
              placeholder="e.g. Implemented payment processing webhook handlers and integration tests"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="btn-cancel-log"
              type="button"
              onClick={() => setIsLogTimeModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-log"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Log Time'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Dialog */}
      <ConfirmDialog
        id="dialog-delete-project"
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete ${projectData.name}? This will remove the project, tasks, and time logs.`}
        confirmLabel="Delete Project"
        isLoading={isDeleting}
      />
    </div>
  );
};
