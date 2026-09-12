import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { DashboardData } from '../types';
import { DashboardCard } from '../components/ui/DashboardCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StatusAlert } from '../components/ui/StatusAlert';
import { ProjectProgressBar } from '../components/projects/ProjectProgressBar';
import { TimerWidget } from '../components/timer/TimerWidget';
import {
  FolderKanban,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  Calendar,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const handleDataUpdate = () => fetchDashboard();
    window.addEventListener('freelanceflow:data-updated', handleDataUpdate);
    return () => window.removeEventListener('freelanceflow:data-updated', handleDataUpdate);
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading FreelanceFlow financial metrics..." fullHeight />;
  }

  if (error || !data) {
    return <StatusAlert message={error || 'Failed to load dashboard'} onRetry={fetchDashboard} />;
  }

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Freelancer Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time financial performance, budget burn-rates, and project delivery status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            id="btn-dash-create-invoice"
            to="/invoices/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </Link>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardCard
          title="Active Projects"
          value={data.activeProjects}
          subtitle="Currently in progress"
          icon={<FolderKanban className="w-5 h-5" />}
          accentColor="blue"
        />

        <DashboardCard
          title="Monthly Revenue"
          value={`$${(data.monthlyRevenue || 0).toLocaleString()}`}
          subtitle="Paid invoices this month"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="emerald"
        />

        <DashboardCard
          title="Pending Invoices"
          value={data.pendingInvoices}
          subtitle="Sent or draft invoices"
          icon={<FileText className="w-5 h-5" />}
          accentColor="purple"
        />

        <DashboardCard
          title="Outstanding"
          value={`$${(data.outstandingAmount || 0).toLocaleString()}`}
          subtitle="Awaiting client payment"
          icon={<CreditCard className="w-5 h-5" />}
          accentColor="amber"
        />

        <DashboardCard
          title="Hours Logged"
          value={`${data.hoursThisMonth || 0} hrs`}
          subtitle="This calendar month"
          icon={<Clock className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Persistent Stopwatch Fast Access */}
      <div>
        <TimerWidget mode="full" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Revenue & Invoiced Totals</h3>
              <p className="text-xs text-slate-500">Trailing 6-month comparison of billed vs paid amounts ($)</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyRevenueChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" name="Paid Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="invoiced" name="Total Invoiced" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Status Distribution (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Invoice Status Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution by volume</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {data.outstandingPaymentsChart && data.outstandingPaymentsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.outstandingPaymentsChart}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.outstandingPaymentsChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [val, 'Invoices']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 text-center">No invoices generated yet</div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Outstanding balance:</span>
            <span className="font-bold text-slate-900">${(data.outstandingAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Project Budget Burn Rates & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Budget Progress & Burn Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Project Budget Burn Rates</h3>
              <p className="text-xs text-slate-500">Hourly billings vs defined project limits</p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              All Projects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-5 flex-1">
            {data.projectBudgetUsage && data.projectBudgetUsage.length > 0 ? (
              data.projectBudgetUsage.slice(0, 4).map((proj) => {
                const calculations = {
                  totalMinutes: 0,
                  totalHours: Math.round(((proj.spent / 100) * 10)) / 10,
                  amountSpent: proj.spent,
                  remainingBudget: proj.remaining,
                  budgetUsagePercent: proj.progress,
                  isOverBudget: proj.isOverBudget,
                  totalTasks: 0,
                  completedTasks: 0,
                };

                return (
                  <div key={proj._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/projects/${proj._id}`}
                        className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {proj.name}
                      </Link>
                      <span className="text-xs text-slate-500">{proj.clientName}</span>
                    </div>

                    <ProjectProgressBar
                      calculations={calculations}
                      budget={proj.budget}
                      showDetails={true}
                    />
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active projects found. Create a project to monitor budget burn rates.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines & Action Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Upcoming Deadlines</h3>
              <p className="text-xs text-slate-500">Project and sprint milestones due soon</p>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Task Board <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {data.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
              data.upcomingDeadlines.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        item.type === 'PROJECT' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {item.type === 'PROJECT' ? <FolderKanban className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-bold text-slate-700">
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No imminent deadlines recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Invoices</h3>
            <p className="text-xs text-slate-500">Latest billing records and settlement statuses</p>
          </div>
          <Link
            to="/invoices"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All Invoices <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Invoice #</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">Issue Date</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentInvoices && data.recentInvoices.length > 0 ? (
                data.recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 font-bold text-blue-600">
                      <Link to={`/invoices/${inv._id}`}>{inv.invoiceNumber}</Link>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-800">
                      {typeof inv.client === 'object' ? inv.client.name : 'Client'}
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900">
                      ${(inv.total || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="font-bold text-blue-600 hover:text-blue-700"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
