import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TimerWidget } from '../components/timer/TimerWidget';
import { timeLogService } from '../services/timeLogService';
import { projectService } from '../services/projectService';
import { TimeLog, Project } from '../types';
import { useTimer } from '../context/TimerContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  Clock,
  Play,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  FolderKanban,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const TimeTrackingPage: React.FC = () => {
  const { startTimer } = useTimer();
  const [recentLogs, setRecentLogs] = useState<TimeLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logs, projs] = await Promise.all([
        timeLogService.getTimeLogs(),
        projectService.getProjects({ status: 'ACTIVE' }),
      ]);
      setRecentLogs(logs.slice(0, 8));
      setProjects(projs);
    } catch (err) {
      console.error('Error loading time tracking overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleDataUpdate = () => fetchData();
    window.addEventListener('freelanceflow:data-updated', handleDataUpdate);
    return () => window.removeEventListener('freelanceflow:data-updated', handleDataUpdate);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Time Tracking & Live Stopwatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track active billable work with precision. State persists across page refreshes and browser tabs.
          </p>
        </div>

        <Link
          to="/time-logs"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" /> View All Logs Table
        </Link>
      </div>

      {/* Main Persistent Stopwatch Widget */}
      <TimerWidget mode="full" />

      {/* Two Column Layout: Quick Project Start & Recent Logged Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Start Launcher (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Quick Project Launch</h3>
            <span className="text-xs text-slate-400">{projects.length} Active</span>
          </div>
          <p className="text-xs text-slate-500">
            One-click to start recording billable hours for your key projects.
          </p>

          <div className="space-y-2.5 pt-2">
            {projects.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No active projects found. Create one first!
              </div>
            ) : (
              projects.map((proj) => {
                const clientName = typeof proj.client === 'object' ? proj.client.name : 'Client';
                return (
                  <button
                    key={proj._id}
                    onClick={() =>
                      startTimer({
                        projectId: proj._id,
                        projectName: proj.name,
                        clientName,
                      })
                    }
                    className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-between group"
                  >
                    <div className="overflow-hidden pr-2">
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 truncate">
                        {proj.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {clientName} • ${proj.hourlyRate}/hr
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-blue-600 group-hover:text-white text-blue-600 border border-slate-200 group-hover:border-blue-600 flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Work Sessions (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Time Entries</h3>
              <p className="text-xs text-slate-500">Recently submitted stopwatch and manual sessions</p>
            </div>
            <Link
              to="/time-logs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              All Time Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading recent sessions..." />
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No time logs recorded yet. Use the stopwatch above to log your first work block!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => {
                const projName = typeof log.project === 'object' ? log.project.name : 'Project';
                const hours = Math.floor(log.durationMinutes / 60);
                const mins = log.durationMinutes % 60;

                return (
                  <div
                    key={log._id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors rounded-xl px-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">{projName}</span>
                          {log.task && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              • {typeof log.task === 'object' ? log.task.title : 'Task'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{log.description || 'Sprint task'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          {hours > 0 ? `${hours}h ` : ''}{mins}m
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-700">
                          ${(log.amount || 0).toLocaleString()} (${log.hourlyRate}/hr)
                        </div>
                      </div>

                      <div>
                        {log.isBilled ? (
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                            Billed
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                            Unbilled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
