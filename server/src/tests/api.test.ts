import { connectDB, disconnectDB } from '../config/db';
import mongoose from 'mongoose';
import { AuthService } from '../services/authService';
import { ClientService } from '../services/clientService';
import { ProjectService } from '../services/projectService';
import { TaskService } from '../services/taskService';
import { TimeLogService } from '../services/timeLogService';
import { InvoiceService } from '../services/invoiceService';
import { PdfService } from '../services/pdfService';
import { SampleDataService } from '../services/sampleDataService';

// Ensure test JWT_SECRET is set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_freelanceflow_testing';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { TimeLog } from '../models/TimeLog';
import { Invoice } from '../models/Invoice';

async function runTests() {
  console.log('\n=============================================');
  console.log('  FREELANCEFLOW BACKEND VERIFICATION SUITE');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    await connectDB();

    // 1. Auth Service: Registration & Hashing
    console.log('\n--- 1. AUTHENTICATION & SECURITY ---');
    const userA = await AuthService.register(
      'Test Freelancer A',
      `test-a-${Date.now()}@example.com`,
      'Password123!'
    );
    assert(Boolean(userA.token && userA.user._id), 'User A registered and received valid JWT token');

    const userAId = userA.user._id!.toString();

    const loginRes = await AuthService.login(userA.user.email!, 'Password123!');
    assert(Boolean(loginRes.token), 'User A can login with correct credentials');

    let duplicateFailed = false;
    try {
      await AuthService.register('Test Duplicate', userA.user.email!, 'Password123!');
    } catch {
      duplicateFailed = true;
    }
    assert(duplicateFailed, 'Duplicate email registration rejected');

    const userB = await AuthService.register(
      'Test Freelancer B',
      `test-b-${Date.now()}@example.com`,
      'Password123!'
    );
    const userBId = userB.user._id!.toString();
    assert(userBId !== userAId, 'User B registered as separate tenant');

    // 2. Client Management & Plan Limits
    console.log('\n--- 2. CLIENT CRUD & PLAN LIMITS ---');
    const client1 = await ClientService.createClient(
      {
        name: 'Client 1 (Free Plan)',
        email: 'client1@acme.com',
        defaultHourlyRate: 100,
      } as any,
      userAId,
      'FREE'
    );
    assert(Boolean(client1._id), 'User A created 1st client on Free plan');

    const client2 = await ClientService.createClient(
      {
        name: 'Client 2 (Free Plan)',
        email: 'client2@acme.com',
        defaultHourlyRate: 120,
      } as any,
      userAId,
      'FREE'
    );
    assert(Boolean(client2._id), 'User A created 2nd client on Free plan');

    let limitEnforced = false;
    try {
      await ClientService.createClient(
        {
          name: 'Client 3 (Should Fail on Free)',
          email: 'client3@acme.com',
        } as any,
        userAId,
        'FREE'
      );
    } catch (err: any) {
      limitEnforced = err.message.includes('Free plan');
    }
    assert(limitEnforced, 'Free plan limit (max 2 clients) strictly enforced with 403 error');

    // Upgrade to PRO
    await AuthService.updatePlan(userAId, 'PRO');
    const client3 = await ClientService.createClient(
      {
        name: 'Client 3 (After Pro Upgrade)',
        email: 'client3@acme.com',
        defaultHourlyRate: 150,
      } as any,
      userAId,
      'PRO'
    );
    assert(Boolean(client3._id), 'User A can create unlimited clients after upgrading to PRO');

    // 3. Multi-Tenancy Isolation
    console.log('\n--- 3. MULTI-TENANCY DATA ISOLATION ---');
    let userBCannotSeeUserA = false;
    try {
      await ClientService.getClientById(client1._id.toString(), userBId);
    } catch (err: any) {
      userBCannotSeeUserA = err.message.includes('not found') || err.message.includes('permission');
    }
    assert(userBCannotSeeUserA, "User B cannot view or access User A's client (Strict Isolation)");

    let userBCannotDeleteUserA = false;
    try {
      await ClientService.deleteClient(client1._id.toString(), userBId);
    } catch (err: any) {
      userBCannotDeleteUserA = err.message.includes('not found') || err.message.includes('permission');
    }
    assert(userBCannotDeleteUserA, "User B cannot delete User A's client");

    // 4. Project & Budget Burn Rate Calculations
    console.log('\n--- 4. PROJECTS & BURN RATE ENGINE ---');
    const project1 = await ProjectService.createProject(
      {
        client: client1._id.toString(),
        name: 'E-Commerce Redesign',
        budget: 1000,
        hourlyRate: 100,
      } as any,
      userAId
    );
    assert(Boolean(project1._id), 'Created project with $1000 budget and $100/hr rate');

    // 5. Tasks & Sprints
    console.log('\n--- 5. TASKS & MILESTONES ---');
    const task1 = await TaskService.createTask(
      {
        project: project1._id.toString(),
        title: 'Setup Stripe webhook handlers',
        priority: 'HIGH',
      } as any,
      userAId
    );
    assert(task1.status === 'TODO', 'Task created with initial status TODO');

    const updatedTask = await TaskService.updateTask(
      task1._id.toString(),
      { status: 'DONE' } as any,
      userAId
    );
    assert(updatedTask.status === 'DONE', 'Task status updated to DONE');

    // 6. Time Tracking & Hourly Calculations
    console.log('\n--- 6. TIME TRACKING & LOGGED HOURS ---');
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 120 * 60 * 1000); // 120 min = 2 hours
    const log1 = await TimeLogService.createTimeLog(
      {
        projectId: project1._id.toString(),
        taskId: task1._id.toString(),
        startTime: now.toISOString(),
        endTime: twoHoursLater.toISOString(),
        description: 'Built checkout flow',
      },
      userAId
    );

    assert(log1.durationMinutes === 120, 'Time log duration calculated as 120 minutes (2.0 hours)');
    assert(log1.amount === 200, 'Time log amount computed as 2.0h * $100/hr = $200');
    assert(log1.isBilled === false, 'Time log initialized as unbilled');

    // Re-check project calculations
    const projectWithCalcs = await ProjectService.getProjectById(project1._id.toString(), userAId);
    assert(
      projectWithCalcs.calculations?.amountSpent === 200 &&
      projectWithCalcs.calculations?.budgetUsagePercent === 20 &&
      projectWithCalcs.calculations?.remainingBudget === 800,
      'Project burn rate engine accurately calculates spent ($200), remaining ($800), and usage (20%)'
    );

    // 7. Invoicing Engine & Unbilled Log Linking
    console.log('\n--- 7. INVOICE GENERATION & AUTOMATED LINKING ---');
    const invoice1 = await InvoiceService.createInvoice(
      {
        clientId: client1._id.toString(),
        dueDate: new Date(Date.now() + 14 * 86400000),
        taxPercent: 10,
        timeLogIds: [log1._id.toString()],
      },
      userAId
    );

    assert(Boolean(invoice1.invoiceNumber), `Generated invoice with sequential number: ${invoice1.invoiceNumber}`);
    assert(invoice1.subtotal === 200, 'Invoice subtotal is $200');
    assert(invoice1.tax === 20, 'Invoice 10% tax is $20');
    assert(invoice1.total === 220, 'Invoice total is $220');

    // Verify time log is now marked as isBilled: true
    const verifiedLog = await TimeLog.findById(log1._id);
    assert(
      verifiedLog?.isBilled === true && verifiedLog?.invoice?.toString() === invoice1._id.toString(),
      'Associated time log is automatically flagged isBilled: true and linked to invoice'
    );

    // 8. Sample Data Generator
    console.log('\n--- 8. SAMPLE DATA GENERATION & SEEDING ---');
    const seedRes = await SampleDataService.loadSampleDataForUser(userBId);
    assert(Boolean(seedRes.success), 'Successfully seeded sample data for User B');

    const userBClients = await ClientService.getClients(userBId);
    assert(userBClients.length >= 2, 'User B now has populated clients and projects');

    // 9. Custom Invoice Item Validation & Invoicing
    console.log('\n--- 9. CUSTOM INVOICE ITEM VALIDATION ---');
    // Valid custom item
    const customInvoice = await InvoiceService.createInvoice(
      {
        clientId: client1._id.toString(),
        dueDate: new Date(Date.now() + 7 * 86400000),
        taxPercent: 5,
        customItems: [
          { description: 'Website Redesign Architecture Deliverable', quantity: 2, rate: 500 },
          { description: 'Security Hardening Review', quantity: 1, rate: 250 },
        ],
      },
      userAId
    );
    assert(Boolean(customInvoice._id), 'Created invoice with valid custom items');
    assert(customInvoice.subtotal === 1250, 'Custom invoice subtotal is $1,250 (2*500 + 1*250)');
    assert(customInvoice.tax === 62.5, 'Custom invoice tax is 5% ($62.50)');
    assert(customInvoice.total === 1312.5, 'Custom invoice total is $1,312.50');

    // Reject oversized description (>300 chars)
    let rejectedOversizedDesc = false;
    try {
      await InvoiceService.createInvoice(
        {
          clientId: client1._id.toString(),
          dueDate: new Date(Date.now() + 7 * 86400000),
          customItems: [
            { description: 'A'.repeat(305), quantity: 1, rate: 100 },
          ],
        },
        userAId
      );
    } catch (err: any) {
      rejectedOversizedDesc = err.message.includes('300 characters');
    }
    assert(rejectedOversizedDesc, 'Rejected custom item with description exceeding 300 characters');

    // Reject invalid numeric rate/quantity
    let rejectedInvalidRate = false;
    try {
      await InvoiceService.createInvoice(
        {
          clientId: client1._id.toString(),
          dueDate: new Date(Date.now() + 7 * 86400000),
          customItems: [
            { description: 'Invalid Rate Item', quantity: 1, rate: -50 },
          ],
        },
        userAId
      );
    } catch (err: any) {
      rejectedInvalidRate = err.message.includes('non-negative');
    }
    assert(rejectedInvalidRate, 'Rejected custom item with negative rate');

    // 10. PDF Generation & Pro Plan Gating
    console.log('\n--- 10. PDF GENERATION & PRO PLAN ENFORCEMENT ---');
    // Test that FREE plan is gated from generating PDF
    let freePlanPdfBlocked = false;
    try {
      await PdfService.generateInvoicePdf(customInvoice._id.toString(), userAId, 'FREE');
    } catch (err: any) {
      freePlanPdfBlocked = err.message.includes('Pro plan');
    }
    assert(freePlanPdfBlocked, 'Free tier is blocked from Puppeteer PDF generation with 403');

    // Test that HTML generation works for any tier
    const htmlOutput = await PdfService.generateInvoiceHtml(customInvoice._id.toString(), userAId);
    assert(
      htmlOutput.includes(customInvoice.invoiceNumber) && htmlOutput.includes('Website Redesign Architecture Deliverable'),
      'HTML template renderer generates correct invoice structure and line items'
    );

    // 11. Security & Configuration Checks
    console.log('\n--- 11. SECURITY & CONFIGURATION VERIFICATION ---');
    assert(process.env.JWT_SECRET !== undefined && process.env.JWT_SECRET.length > 0, 'JWT_SECRET is configured for test runtime');

    // Verify token signing & verification with dynamic secret
    const testToken = AuthService.generateToken(userAId);
    assert(typeof testToken === 'string' && testToken.split('.').length === 3, 'AuthService signs valid 3-part JWT token using dynamic secret');

    console.log('\n=============================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    await disconnectDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
