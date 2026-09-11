export interface User {
  _id: string;
  name: string;
  email: string;
  plan: 'FREE' | 'PRO';
  createdAt: string;
}

export interface Client {
  _id: string;
  user: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  defaultHourlyRate: number;
  currency: string;
  totalProjects?: number;
  activeProjects?: number;
  totalPaid?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCalculations {
  totalMinutes: number;
  totalHours: number;
  amountSpent: number;
  remainingBudget: number;
  budgetUsagePercent: number;
  isOverBudget: boolean;
  totalTasks: number;
  completedTasks: number;
}

export interface Project {
  _id: string;
  user: string;
  client: Client | any;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  budget: number;
  hourlyRate: number;
  startDate?: string;
  deadline?: string;
  calculations?: ProjectCalculations;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  user: string;
  project: any;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeLog {
  _id: string;
  user: string;
  project: any;
  task?: any;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  description: string;
  hourlyRate: number;
  amount: number;
  isBilled: boolean;
  invoice?: any;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  _id?: string;
  invoice?: string;
  description: string;
  quantity: number;
  hours?: number;
  rate: number;
  amount: number;
  timeLog?: any;
  timeLogId?: string;
}

export interface Invoice {
  _id: string;
  user: User | string;
  client: Client | any;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  taxRate?: number;
  tax: number;
  total: number;
  notes?: string;
  pdfPath?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  activeProjects: number;
  pendingInvoices: number;
  outstandingAmount: number;
  monthlyRevenue: number;
  hoursThisMonth: number;
  upcomingDeadlines: Array<{
    id: string;
    type: 'PROJECT' | 'TASK';
    title: string;
    subtitle: string;
    date: string;
    status: string;
  }>;
  recentInvoices: Invoice[];
  projectBudgetUsage: Array<{
    _id: string;
    name: string;
    clientName: string;
    budget: number;
    spent: number;
    remaining: number;
    progress: number;
    isOverBudget: boolean;
    status: string;
    deadline?: string;
  }>;
  monthlyRevenueChart: Array<{
    month: string;
    revenue: number;
    invoiced: number;
  }>;
  outstandingPaymentsChart: Array<{
    name: string;
    value: number;
  }>;
}

export interface ActiveTimerState {
  projectId: string;
  taskId?: string;
  startTime: number; // timestamp in ms
  description: string;
  isRunning: boolean;
}
