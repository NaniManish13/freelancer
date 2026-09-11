import { Client } from '../models/Client.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { TimeLog } from '../models/TimeLog.js';
import { Invoice } from '../models/Invoice.js';
import { InvoiceItem } from '../models/InvoiceItem.js';
import { User } from '../models/User.js';

export class SampleDataService {
  static async clearDataForUser(userId: string) {
    const invoices = await Invoice.find({ user: userId }).select('_id');
    const invoiceIds = invoices.map((invoice) => invoice._id);

    await Promise.all([
      InvoiceItem.deleteMany({ invoice: { $in: invoiceIds } }),
      Client.deleteMany({ user: userId }),
      Project.deleteMany({ user: userId }),
      Task.deleteMany({ user: userId }),
      TimeLog.deleteMany({ user: userId }),
      Invoice.deleteMany({ user: userId }),
    ]);

    return { success: true, message: 'All user data cleared successfully.' };
  }

  static async loadSampleDataForUser(userId: string) {
    // 1. Temporarily or permanently upgrade plan to PRO for demo experience so all 5 clients & PDF generation are unlocked
    await User.findByIdAndUpdate(userId, { plan: 'PRO' });

    // 2. Check if sample data already created for this user
    const existingClients = await Client.find({ user: userId });
    if (existingClients.length >= 4) {
      return {
        success: true,
        message: 'Sample data is already populated for your account.',
        alreadyPopulated: true,
      };
    }

    // 3. Clear existing user data to ensure clean realistic state
    await this.clearDataForUser(userId);

    const now = new Date();
    const currentYear = now.getFullYear();

    // 4. Create 5 realistic Clients
    const clientsData = [
      {
        name: 'Alex Vance',
        companyName: 'Acme SaaS Labs',
        email: 'alex@acmesaashq.io',
        phone: '+1 (555) 234-5678',
        address: '500 Howard St, Suite 400, San Francisco, CA 94105',
        defaultHourlyRate: 95,
        currency: 'USD',
      },
      {
        name: 'Elena Rostova',
        companyName: 'Nordic Peak Design',
        email: 'elena@nordicpeak.se',
        phone: '+46 8 123 4567',
        address: 'Kungsgatan 12, Stockholm, Sweden',
        defaultHourlyRate: 85,
        currency: 'USD',
      },
      {
        name: 'Marcus Chen',
        companyName: 'Nexus Fintech Corp',
        email: 'mchen@nexusfintech.com',
        phone: '+1 (415) 890-1234',
        address: '101 California St, San Francisco, CA 94111',
        defaultHourlyRate: 110,
        currency: 'USD',
      },
      {
        name: 'Sophie Dubois',
        companyName: 'Lumière E-Commerce',
        email: 'sophie@lumiere-paris.fr',
        phone: '+33 1 42 68 55 00',
        address: '14 Rue de Rivoli, 75001 Paris, France',
        defaultHourlyRate: 75,
        currency: 'USD',
      },
      {
        name: 'David Miller',
        companyName: 'Aura Health & Fitness',
        email: 'david@aurahealthapp.com',
        phone: '+1 (212) 555-7890',
        address: '350 5th Ave, New York, NY 10118',
        defaultHourlyRate: 80,
        currency: 'USD',
      },
    ];

    const createdClients = await Promise.all(
      clientsData.map((c) => Client.create({ ...c, user: userId }))
    );

    // 5. Create 5 Projects
    const projectsData = [
      {
        client: createdClients[0]._id,
        name: 'SaaS Billing & Analytics Dashboard',
        description: 'Complete overhaul of subscriber metrics, MRR forecasting, and Stripe webhook ingestion pipeline.',
        status: 'ACTIVE' as const,
        budget: 6500,
        hourlyRate: 95,
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 10),
        deadline: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      },
      {
        client: createdClients[1]._id,
        name: 'Design System & Component Library',
        description: 'Building an accessible React UI toolkit with Tailwind CSS and Framer Motion for cross-team use.',
        status: 'ACTIVE' as const,
        budget: 4800,
        hourlyRate: 85,
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 5),
        deadline: new Date(now.getFullYear(), now.getMonth(), 28),
      },
      {
        client: createdClients[2]._id,
        name: 'High-Frequency Crypto Order Router',
        description: 'Low-latency execution service with Websocket telemetry and risk management circuit breakers.',
        status: 'ACTIVE' as const,
        budget: 9200,
        hourlyRate: 110,
        startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1),
      },
      {
        client: createdClients[3]._id,
        name: 'Shopify Headless Storefront Migration',
        description: 'Migrating legacy theme to Next.js with Algolia search and internationalized multi-currency checkout.',
        status: 'COMPLETED' as const,
        budget: 3500,
        hourlyRate: 75,
        startDate: new Date(now.getFullYear(), now.getMonth() - 4, 15),
        deadline: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      },
      {
        client: createdClients[4]._id,
        name: 'Mobile Workout Engine & Video Sync',
        description: 'Interactive audio coaching playback engine with offline heart rate tracking telemetry.',
        status: 'PAUSED' as const,
        budget: 4000,
        hourlyRate: 80,
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 20),
        deadline: new Date(now.getFullYear(), now.getMonth() + 1, 30),
      },
    ];

    const createdProjects = await Promise.all(
      projectsData.map((p) => Project.create({ ...p, user: userId }))
    );

    // 6. Create Tasks
    const tasksData = [
      {
        project: createdProjects[0]._id,
        title: 'Implement Stripe webhook signature verification',
        description: 'Ensure idempotency and replay attack prevention for invoice.payment_succeeded events.',
        status: 'DONE' as const,
        priority: 'HIGH' as const,
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 20),
      },
      {
        project: createdProjects[0]._id,
        title: 'Build MRR / ARR revenue retention chart',
        description: 'Cohort analysis data visualizer with Recharts stacked bar view.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
      },
      {
        project: createdProjects[0]._id,
        title: 'Export financial reports to CSV & PDF',
        description: 'Background worker to aggregate monthly tax summaries.',
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8),
      },
      {
        project: createdProjects[1]._id,
        title: 'Build accessible Modal dialog component',
        description: 'Focus trap, escape key listeners, and WAI-ARIA compliance.',
        status: 'DONE' as const,
        priority: 'MEDIUM' as const,
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 12),
      },
      {
        project: createdProjects[1]._id,
        title: 'Create dark mode token palette and CSS variables',
        description: 'Support high-contrast theme switching without layout shifts.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      },
      {
        project: createdProjects[2]._id,
        title: 'Benchmark Websocket latency under 10k connections',
        description: 'Profile event loop latency and memory footprints during market volatility bursts.',
        status: 'DONE' as const,
        priority: 'HIGH' as const,
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 28),
      },
      {
        project: createdProjects[2]._id,
        title: 'Implement failover circuit breaker for liquidity provider',
        description: 'Auto-route order flows when endpoint p99 response exceeds 150ms.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
      },
      {
        project: createdProjects[3]._id,
        title: 'Finalize Algolia instant search integration',
        description: 'Facet filtering by price, category, and real-time inventory count.',
        status: 'DONE' as const,
        priority: 'MEDIUM' as const,
        dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 10),
      },
    ];

    const createdTasks = await Promise.all(
      tasksData.map((t) => Task.create({ ...t, user: userId }))
    );

    // 7. Create Time Logs (historical & recent)
    const timeLogsToCreate = [
      // Project 0 logs
      {
        project: createdProjects[0]._id,
        task: createdTasks[0]._id,
        startTime: new Date(now.getFullYear(), now.getMonth() - 2, 12, 9, 0),
        endTime: new Date(now.getFullYear(), now.getMonth() - 2, 12, 14, 30),
        durationMinutes: 330,
        description: 'Designed Stripe webhook endpoints and mock payload fixtures',
        hourlyRate: 95,
        amount: 522.5,
        isBilled: true,
      },
      {
        project: createdProjects[0]._id,
        task: createdTasks[0]._id,
        startTime: new Date(now.getFullYear(), now.getMonth() - 2, 15, 10, 0),
        endTime: new Date(now.getFullYear(), now.getMonth() - 2, 15, 16, 0),
        durationMinutes: 360,
        description: 'Implemented signature verification and DB transaction rollback logic',
        hourlyRate: 95,
        amount: 570.0,
        isBilled: true,
      },
      {
        project: createdProjects[0]._id,
        task: createdTasks[1]._id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 9, 30),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4, 13, 0),
        durationMinutes: 210,
        description: 'Configured MRR monthly calculation aggregation pipeline',
        hourlyRate: 95,
        amount: 332.5,
        isBilled: false,
      },
      {
        project: createdProjects[0]._id,
        task: createdTasks[1]._id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18, 15),
        durationMinutes: 255,
        description: 'Refined cohort analysis responsive bar chart visualization',
        hourlyRate: 95,
        amount: 403.75,
        isBilled: false,
      },

      // Project 1 logs
      {
        project: createdProjects[1]._id,
        task: createdTasks[3]._id,
        startTime: new Date(now.getFullYear(), now.getMonth() - 1, 8, 9, 0),
        endTime: new Date(now.getFullYear(), now.getMonth() - 1, 8, 15, 0),
        durationMinutes: 360,
        description: 'Built base modal accessible focus trapping logic and storybook stories',
        hourlyRate: 85,
        amount: 510.0,
        isBilled: true,
      },
      {
        project: createdProjects[1]._id,
        task: createdTasks[4]._id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 10, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 14, 45),
        durationMinutes: 285,
        description: 'Created dark mode CSS design tokens and typography hierarchy',
        hourlyRate: 85,
        amount: 403.75,
        isBilled: false,
      },

      // Project 2 logs
      {
        project: createdProjects[2]._id,
        task: createdTasks[5]._id,
        startTime: new Date(now.getFullYear(), now.getMonth() - 3, 10, 8, 30),
        endTime: new Date(now.getFullYear(), now.getMonth() - 3, 10, 16, 30),
        durationMinutes: 480,
        description: 'Websocket cluster setup and load testing with k6',
        hourlyRate: 110,
        amount: 880.0,
        isBilled: true,
      },
      {
        project: createdProjects[2]._id,
        task: createdTasks[6]._id,
        startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 9, 0),
        endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 15, 30),
        durationMinutes: 390,
        description: 'Circuit breaker pattern implementation with Redis state cache',
        hourlyRate: 110,
        amount: 715.0,
        isBilled: false,
      },

      // Project 3 logs
      {
        project: createdProjects[3]._id,
        task: createdTasks[7]._id,
        startTime: new Date(now.getFullYear(), now.getMonth() - 4, 16, 9, 0),
        endTime: new Date(now.getFullYear(), now.getMonth() - 4, 16, 17, 0),
        durationMinutes: 480,
        description: 'Algolia index sync worker and product catalogue schema mapping',
        hourlyRate: 75,
        amount: 600.0,
        isBilled: true,
      },
    ];

    const createdTimeLogs = await Promise.all(
      timeLogsToCreate.map((log) => TimeLog.create({ ...log, user: userId }))
    );

    // 8. Create Invoices (Multi-month: Paid, Sent, Overdue)
    // Invoice 1 (Paid - 3 months ago)
    const inv1 = await Invoice.create({
      user: userId,
      client: createdClients[3]._id,
      invoiceNumber: `FF-${currentYear}-000001`,
      issueDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      dueDate: new Date(now.getFullYear(), now.getMonth() - 3, 15),
      status: 'PAID',
      subtotal: 2250,
      tax: 0,
      total: 2250,
      notes: 'Payment received via SEPA Transfer. Thank you!',
    });
    await InvoiceItem.create({
      invoice: inv1._id,
      description: 'Shopify Storefront Migration - Initial Architecture & Setup',
      quantity: 30,
      rate: 75,
      amount: 2250,
      timeLog: createdTimeLogs[8]._id,
    });
    await TimeLog.findByIdAndUpdate(createdTimeLogs[8]._id, { invoice: inv1._id });

    // Invoice 2 (Paid - 2 months ago)
    const inv2 = await Invoice.create({
      user: userId,
      client: createdClients[2]._id,
      invoiceNumber: `FF-${currentYear}-000002`,
      issueDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      status: 'PAID',
      subtotal: 3520,
      tax: 0,
      total: 3520,
      notes: 'Paid via Wire Transfer.',
    });
    await InvoiceItem.create({
      invoice: inv2._id,
      description: 'Crypto Router: Websocket load testing and performance benchmarks (32 hrs)',
      quantity: 32,
      rate: 110,
      amount: 3520,
      timeLog: createdTimeLogs[6]._id,
    });
    await TimeLog.findByIdAndUpdate(createdTimeLogs[6]._id, { invoice: inv2._id });

    // Invoice 3 (Paid - 1 month ago)
    const inv3 = await Invoice.create({
      user: userId,
      client: createdClients[0]._id,
      invoiceNumber: `FF-${currentYear}-000003`,
      issueDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      status: 'PAID',
      subtotal: 1092.5,
      tax: 87.4,
      total: 1179.9,
      notes: 'Stripe Webhooks milestone completed. Net 15.',
    });
    await InvoiceItem.create({
      invoice: inv3._id,
      description: 'Stripe Webhook Infrastructure (11.5 hrs)',
      quantity: 11.5,
      rate: 95,
      amount: 1092.5,
      timeLog: createdTimeLogs[0]._id,
    });
    await TimeLog.findByIdAndUpdate(createdTimeLogs[0]._id, { invoice: inv3._id });
    await TimeLog.findByIdAndUpdate(createdTimeLogs[1]._id, { invoice: inv3._id });

    // Invoice 4 (SENT - pending payment, due in 10 days)
    const inv4 = await Invoice.create({
      user: userId,
      client: createdClients[1]._id,
      invoiceNumber: `FF-${currentYear}-000004`,
      issueDate: new Date(now.getFullYear(), now.getMonth(), 1),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
      status: 'SENT',
      subtotal: 1870,
      tax: 0,
      total: 1870,
      notes: 'Design System Phase 1 delivery. Please remit within 14 days.',
    });
    await InvoiceItem.create({
      invoice: inv4._id,
      description: 'Design System Modal & Component Core Library (22 hrs)',
      quantity: 22,
      rate: 85,
      amount: 1870,
      timeLog: createdTimeLogs[4]._id,
    });
    await TimeLog.findByIdAndUpdate(createdTimeLogs[4]._id, { invoice: inv4._id });

    // Invoice 5 (OVERDUE - due 5 days ago)
    const inv5 = await Invoice.create({
      user: userId,
      client: createdClients[4]._id,
      invoiceNumber: `FF-${currentYear}-000005`,
      issueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
      status: 'OVERDUE',
      subtotal: 1600,
      tax: 128,
      total: 1728,
      notes: 'Reminder: This invoice is overdue. Please settle at earliest convenience.',
    });
    await InvoiceItem.create({
      invoice: inv5._id,
      description: 'Mobile Workout Audio Engine sprint (20 hrs)',
      quantity: 20,
      rate: 80,
      amount: 1600,
    });

    return {
      success: true,
      message: 'Realistic sample data loaded successfully with 5 clients, 5 projects, tasks, time logs, and invoices.',
    };
  }
}
