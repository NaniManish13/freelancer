import React, { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { Task, Project } from '../types';
import { useToast } from '../context/ToastContext';
import { useTimer } from '../context/TimerContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Play,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  Edit2,
  FolderKanban,
  AlertCircle,
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { success, error } = useToast();
  const { startTimer } = useTimer();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
  });

  const fetchTasks = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await taskService.getTasks({
        project: selectedProject || undefined,
        priority: selectedPriority || undefined,
        search: search || undefined,
      });
      setTasks(data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects({ status: 'ACTIVE' });
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
    fetchTasks();

    const handleDataUpdate = () => fetchTasks();
    window.addEventListener('freelanceflow:data-updated', handleDataUpdate);
    return () => window.removeEventListener('freelanceflow:data-updated', handleDataUpdate);
  }, [search, selectedProject, selectedPriority]);

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId && !editingTask) {
      error('Please select a project for this task');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask._id, {
          title: formData.title,
          description: formData.description,
          status: formData.status as any,
          priority: formData.priority as any,
          dueDate: formData.dueDate || undefined,
        });
        success('Task updated successfully');
      } else {
        await taskService.createTask({
          project: formData.projectId,
          title: formData.title,
          description: formData.description,
          status: formData.status as any,
          priority: formData.priority as any,
          dueDate: formData.dueDate || undefined,
        });
        success('Task created successfully');
      }

      setIsAddModalOpen(false);
      setEditingTask(null);
      setFormData({
        projectId: projects[0]?._id || '',
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
      });
      fetchTasks();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus =
      task.status === 'TODO'
        ? 'IN_PROGRESS'
        : task.status === 'IN_PROGRESS'
        ? 'DONE'
        : 'TODO';

    try {
      await taskService.updateTask(task._id, { status: nextStatus });
      success(`Task moved to ${nextStatus.replace('_', ' ')}`);
      fetchTasks();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    setIsSubmitting(true);
    try {
      await taskService.deleteTask(deletingTaskId);
      success('Task deleted');
      setDeletingTaskId(null);
      fetchTasks();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      projectId: typeof task.project === 'object' ? task.project._id : task.project,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setIsAddModalOpen(true);
  };

  // Group tasks by status for columns
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  const renderTaskCard = (task: Task) => {
    const projectName = typeof task.project === 'object' ? task.project.name : 'Project';
    const projectId = typeof task.project === 'object' ? task.project._id : task.project;

    return (
      <div
        key={task._id}
        className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold truncate">
            <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{projectName}</span>
          </div>
          <StatusBadge status={task.priority} size="sm" />
        </div>

        <div>
          <h4
            className={`text-sm font-bold text-slate-900 ${
              task.status === 'DONE' ? 'line-through text-slate-400' : ''
            }`}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{task.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          {task.dueDate ? (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          ) : (
            <span className="text-slate-400">No due date</span>
          )}

          <div className="flex items-center gap-1">
            {/* Start Stopwatch */}
            <button
              id={`btn-task-timer-${task._id}`}
              onClick={() =>
                startTimer({
                  projectId,
                  projectName,
                  taskId: task._id,
                  taskTitle: task.title,
                })
              }
              title="Start timer for this task"
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>

            {/* Toggle Status */}
            <button
              id={`btn-task-toggle-${task._id}`}
              onClick={() => handleToggleStatus(task)}
              title="Advance status"
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>

            {/* Edit */}
            <button
              id={`btn-task-edit-${task._id}`}
              onClick={() => openEditModal(task)}
              title="Edit Task"
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              id={`btn-task-delete-${task._id}`}
              onClick={() => setDeletingTaskId(task._id)}
              title="Delete Task"
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Board</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize sprint deliverables, trigger task timers, and track milestone completions.
          </p>
        </div>

        <button
          id="btn-add-task-global"
          onClick={() => {
            setEditingTask(null);
            setFormData({
              projectId: projects[0]?._id || '',
              title: '',
              description: '',
              status: 'TODO',
              priority: 'MEDIUM',
              dueDate: '',
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-tasks"
            type="text"
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Project Filter */}
          <select
            id="select-task-project"
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

          {/* Priority Filter */}
          <select
            id="select-task-priority"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task Board Columns */}
      {loading ? (
        <LoadingSpinner label="Loading tasks..." />
      ) : errorMessage ? (
        <ErrorMessage message={errorMessage} onRetry={fetchTasks} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: TODO */}
          <div className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/80 space-y-3 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">To Do</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {todoTasks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No tasks to do</div>
              ) : (
                todoTasks.map((t) => renderTaskCard(t))
              )}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className="bg-blue-50/40 rounded-2xl p-4 border border-blue-200/60 space-y-3 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900">In Progress</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {inProgressTasks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No active tasks</div>
              ) : (
                inProgressTasks.map((t) => renderTaskCard(t))
              )}
            </div>
          </div>

          {/* Column 3: DONE */}
          <div className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-200/60 space-y-3 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900">Completed</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {doneTasks.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">No completed tasks yet</div>
              ) : (
                doneTasks.map((t) => renderTaskCard(t))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        id="modal-add-edit-task"
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
        subtitle="Specify task deliverables, priority ranking, and target date."
        maxWidth="md"
      >
        <form onSubmit={handleCreateOrUpdateTask} className="space-y-4">
          {!editingTask && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Project *
              </label>
              {projects.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  Please create a project before adding tasks.
                </div>
              ) : (
                <select
                  id="input-task-proj-select"
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              id="input-task-title-field"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Implement invoice PDF export handler"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              id="input-task-description-field"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notes, user stories, acceptance criteria..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                id="input-task-status-field"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                id="input-task-priority-field"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                id="input-task-duedate-field"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="btn-cancel-task-form"
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-task-form"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Task Dialog */}
      <ConfirmDialog
        id="dialog-delete-task"
        isOpen={Boolean(deletingTaskId)}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? Any logged time records will be retained."
        confirmLabel="Delete Task"
        isLoading={isSubmitting}
      />
    </div>
  );
};
