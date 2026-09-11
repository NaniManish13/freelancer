import React, { useState, useEffect } from 'react';
import { useTimer } from '../../context/TimerContext';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { Project, Task } from '../../types';
import { Play, Pause, Square, Trash2, Clock, CheckCircle2, ChevronRight, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimerWidgetProps {
  mode?: 'full' | 'compact' | 'bar';
}

export const TimerWidget: React.FC<TimerWidgetProps> = ({ mode = 'full' }) => {
  const {
    timer,
    formattedTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    discardTimer,
    updateTimerDescription,
  } = useTimer();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load active projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectService.getProjects({ status: 'ACTIVE' });
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    loadProjects();
  }, []);

  // Load tasks for selected project
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      setSelectedTaskId('');
      return;
    }

    const loadTasks = async () => {
      try {
        const data = await taskService.getTasks({ project: selectedProjectId, status: 'IN_PROGRESS' });
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };
    loadTasks();
  }, [selectedProjectId]);

  const handleStart = () => {
    if (!selectedProjectId) return;
    const proj = projects.find((p) => p._id === selectedProjectId);
    const tsk = tasks.find((t) => t._id === selectedTaskId);

    startTimer({
      projectId: selectedProjectId,
      projectName: proj?.name,
      clientName: typeof proj?.client === 'object' ? proj.client.name : undefined,
      taskId: selectedTaskId || undefined,
      taskTitle: tsk?.title,
      description: description.trim(),
    });
  };

  const handleStop = async () => {
    setIsSubmitting(true);
    try {
      await stopTimer();
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Compact / Top Bar Mode
  if (mode === 'bar') {
    if (!timer) {
      return (
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100/70 border border-slate-200/60 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">00:00:00</span>
          <span className="hidden md:inline font-medium text-slate-500">• Ready</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-full shadow-xs">
        <span className="relative flex h-2 w-2">
          {timer.isRunning && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              timer.isRunning ? 'bg-blue-600' : 'bg-amber-500'
            }`}
          ></span>
        </span>

        <span className="font-mono font-bold text-xs tracking-wider">{formattedTime}</span>

        <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate text-slate-700">
          {timer.projectName || 'Active Task'}
        </span>

        <div className="flex items-center gap-1 pl-1 border-l border-blue-200">
          {timer.isRunning ? (
            <button
              id="bar-btn-pause"
              onClick={pauseTimer}
              title="Pause Timer"
              className="p-1 hover:bg-blue-200/60 text-blue-800 rounded-full transition-colors"
            >
              <Pause className="w-3 h-3 fill-current" />
            </button>
          ) : (
            <button
              id="bar-btn-resume"
              onClick={resumeTimer}
              title="Resume Timer"
              className="p-1 hover:bg-blue-200/60 text-blue-800 rounded-full transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
          )}

          <button
            id="bar-btn-stop"
            onClick={handleStop}
            disabled={isSubmitting}
            title="Stop & Log Time"
            className="p-1 hover:bg-rose-100 text-rose-600 rounded-full transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Full Stopwatch Widget
  return (
    <div
      id="persistent-stopwatch-widget"
      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm relative overflow-hidden"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Persistent Stopwatch & Live Tracker</h3>
            <p className="text-xs text-slate-500">
              Recovers on reload, continues across pages, and logs duration directly to the database.
            </p>
          </div>
        </div>

        {timer && (
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                timer.isRunning ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {timer.isRunning ? '● RECORDING' : '❚❚ PAUSED'}
            </span>
          </div>
        )}
      </div>

      {timer ? (
        // Active Running View
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6 bg-slate-900 text-white rounded-2xl shadow-inner relative overflow-hidden">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
              Active Elapsed Time
            </div>
            <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight">
              {formattedTime}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
              <span>Project: <strong>{timer.projectName}</strong></span>
              {timer.taskTitle && <span>• Task: <strong>{timer.taskTitle}</strong></span>}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Work Description
            </label>
            <input
              id="timer-active-description"
              type="text"
              value={timer.description}
              onChange={(e) => updateTimerDescription(e.target.value)}
              placeholder="What are you currently working on?"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              id="btn-discard-timer"
              onClick={discardTimer}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Discard
            </button>

            <div className="flex items-center gap-3">
              {timer.isRunning ? (
                <button
                  id="btn-pause-timer"
                  onClick={pauseTimer}
                  className="px-5 py-2.5 text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Pause className="w-4 h-4 fill-current" /> Pause
                </button>
              ) : (
                <button
                  id="btn-resume-timer"
                  onClick={resumeTimer}
                  className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Resume
                </button>
              )}

              <button
                id="btn-stop-save-timer"
                onClick={handleStop}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Saving Log...' : 'Stop & Save to DB'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Start Form View
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Project *
              </label>
              <select
                id="timer-select-project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {projects.length === 0 ? (
                  <option value="">No active projects found</option>
                ) : (
                  projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({typeof p.client === 'object' ? p.client.name : 'Client'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assign to Task (Optional)
              </label>
              <select
                id="timer-select-task"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">General Project Work (No specific task)</option>
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task / Sprint Description
            </label>
            <input
              id="timer-input-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Refactoring authentication middleware and Stripe webhook handlers"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-slate-500">
              Timer timestamps will be saved as verified hours upon stopping.
            </span>
            <button
              id="btn-start-persistent-timer"
              onClick={handleStart}
              disabled={!selectedProjectId}
              className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" /> Start Stopwatch
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
