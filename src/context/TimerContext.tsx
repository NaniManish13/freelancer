import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { timeLogService } from '../services/timeLogService';
import { useToast } from './ToastContext';

export interface PersistentTimer {
  projectId: string;
  projectName?: string;
  clientName?: string;
  taskId?: string;
  taskTitle?: string;
  startTime: number; // timestamp in ms
  description: string;
  isRunning: boolean;
  pausedAccumulatedMs: number; // accumulated time when paused
  lastPauseTimestamp?: number;
}

interface TimerContextType {
  timer: PersistentTimer | null;
  elapsedSeconds: number;
  formattedTime: string;
  startTimer: (params: {
    projectId: string;
    projectName?: string;
    clientName?: string;
    taskId?: string;
    taskTitle?: string;
    description?: string;
  }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  discardTimer: () => void;
  updateTimerDescription: (desc: string) => void;
}

const TIMER_STORAGE_KEY = 'freelanceflow_active_timer';

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timer, setTimer] = useState<PersistentTimer | null>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const { success, error } = useToast();

  // Save to localStorage whenever timer state changes
  useEffect(() => {
    if (timer) {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
    } else {
      localStorage.removeItem(TIMER_STORAGE_KEY);
      setElapsedSeconds(0);
    }
  }, [timer]);

  // Tick calculation: compute elapsed from timestamps, NEVER incrementing counter as source of truth
  useEffect(() => {
    if (!timer) {
      setElapsedSeconds(0);
      return;
    }

    const calculateElapsed = () => {
      const now = Date.now();
      let totalMs = timer.pausedAccumulatedMs || 0;

      if (timer.isRunning) {
        totalMs += Math.max(0, now - timer.startTime);
      }

      setElapsedSeconds(Math.floor(totalMs / 1000));
    };

    calculateElapsed();

    if (!timer.isRunning) return;

    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = useCallback(
    (params: {
      projectId: string;
      projectName?: string;
      clientName?: string;
      taskId?: string;
      taskTitle?: string;
      description?: string;
    }) => {
      const newTimer: PersistentTimer = {
        projectId: params.projectId,
        projectName: params.projectName,
        clientName: params.clientName,
        taskId: params.taskId || undefined,
        taskTitle: params.taskTitle || undefined,
        startTime: Date.now(),
        description: params.description || '',
        isRunning: true,
        pausedAccumulatedMs: 0,
      };
      setTimer(newTimer);
      success(`Timer started for ${params.projectName || 'project'}`);
    },
    [success]
  );

  const pauseTimer = useCallback(() => {
    if (!timer || !timer.isRunning) return;
    const now = Date.now();
    const additionalMs = Math.max(0, now - timer.startTime);
    setTimer({
      ...timer,
      isRunning: false,
      pausedAccumulatedMs: (timer.pausedAccumulatedMs || 0) + additionalMs,
      lastPauseTimestamp: now,
    });
  }, [timer]);

  const resumeTimer = useCallback(() => {
    if (!timer || timer.isRunning) return;
    setTimer({
      ...timer,
      isRunning: true,
      startTime: Date.now(),
      lastPauseTimestamp: undefined,
    });
  }, [timer]);

  const stopTimer = useCallback(async () => {
    if (!timer) return;

    // Calculate total duration
    const now = Date.now();
    let totalMs = timer.pausedAccumulatedMs || 0;
    if (timer.isRunning) {
      totalMs += Math.max(0, now - timer.startTime);
    }

    // Must be at least 1 minute or at least 10 seconds for testing
    const startTimeDate = new Date(now - totalMs);
    const endTimeDate = new Date(now);

    try {
      await timeLogService.createTimeLog({
        projectId: timer.projectId,
        taskId: timer.taskId,
        startTime: startTimeDate.toISOString(),
        endTime: endTimeDate.toISOString(),
        description: timer.description || 'Tracked time entry',
      });

      const minutes = Math.max(1, Math.round(totalMs / 60000));
      success(`Logged ${minutes} minute${minutes === 1 ? '' : 's'} of work to database!`);
      setTimer(null);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save time log to database.');
    }
  }, [timer, success, error]);

  const discardTimer = useCallback(() => {
    setTimer(null);
  }, []);

  const updateTimerDescription = useCallback(
    (desc: string) => {
      if (!timer) return;
      setTimer({ ...timer, description: desc });
    },
    [timer]
  );

  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        timer,
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        discardTimer,
        updateTimerDescription,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
