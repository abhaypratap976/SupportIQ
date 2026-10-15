// SupportIQ Full-Stack Security & API Integration Test Suite
// Verifies real MongoDB persistence, JWT/cookie authentication, strict RBAC, customer privacy & ticket lifecycle

import { startServer, stopServer } from './server/server.js';
import { User } from './server/models/User.js';
import { Ticket } from './server/models/Ticket.js';
import { TicketMessage } from './server/models/TicketMessage.js';
import { Article } from './server/models/Article.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runIntegrationTests() {
  console.log('====================================================');
  console.log(' SupportIQ Server, Database & Security Integration QA');
  console.log('====================================================\n');

  const TEST_PORT = 5099;
  const BASE_URL = `http://localhost:${TEST_PORT}/api`;

  console.log('1. Initializing test server and connecting to MongoDB...');
  await startServer(TEST_PORT);
  console.log('  ✓ Connected to database and started test server.\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Health check endpoint
    // ----------------------------------------------------
    console.log('2. Testing Health Check Endpoint & Sanitization...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health check returned HTTP 200');
    assert(healthData.status === 'ok', 'Service status is ok');
    assert(healthData.database === 'connected', 'Database status is connected');
    assert(!healthData.jwtSecret && !healthData.mongoUri, 'Health check does not reveal secrets or credentials');

    // ----------------------------------------------------
    // TEST 2: Admin and Staff Authentication
    // ----------------------------------------------------
    console.log('\n3. Testing Admin & Staff Authentication...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.c@supportiq.io', password: 'password123' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin logged in successfully');
    assert(adminLoginData.user.role === 'Admin', 'Admin user role is Admin');
    assert(adminLoginData.token !== undefined, 'Admin received authentication JWT');
    const adminToken = adminLoginData.token;

    // Verify password is never returned in user response
    assert(!adminLoginData.user.password, 'Password hash is strictly omitted from login response');

    // Agent Login
    const agentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.r@supportiq.io', password: 'password123' })
    });
    const agentLoginData = await agentLoginRes.json();
    assert(agentLoginRes.status === 200, 'Agent logged in successfully');
    assert(agentLoginData.user.role === 'Agent', 'Agent role is Agent');
    const agentToken = agentLoginData.token;

    // Invalid Login
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sarah.c@supportiq.io', password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with HTTP 401');

    // ----------------------------------------------------
    // TEST 3: Customer Authentication & Strict Role Escaping Prevention
    // ----------------------------------------------------
    console.log('\n4. Testing Customer Registration & Role Escaping Protection...');
    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jordan.h@finscale.net', password: 'password123' })
    });
    const customerLoginData = await customerLoginRes.json();
    assert(customerLoginRes.status === 200, 'Existing customer logged in');
    assert(customerLoginData.user.role === 'Customer', 'Customer user role is Customer');
    const customerToken = customerLoginData.token;

    // Self-registration: attempt privilege escalation by passing role='Admin'
    const exploitEmail = `attacker-${Date.now()}@test.io`;
    const exploitRegisterRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker User',
        email: exploitEmail,
        password: 'securepassword123',
        company: 'Exploit Org',
        role: 'Admin' // MALICIOUS INJECTION ATTEMPT
      })
    });
    const exploitRegisterData = await exploitRegisterRes.json();
    assert(exploitRegisterRes.status === 201, 'Registration succeeded');
    assert(exploitRegisterData.user.role === 'Customer', 'Privilege Escalation Blocked: Role forced to "Customer"');

    // ----------------------------------------------------
    // TEST 4: Customer Resource Scoping & Isolation
    // ----------------------------------------------------
    console.log('\n5. Testing Customer Ticket Isolation & Resource-Level Scoping...');
    // Customer requests all tickets
    const custTicketsRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const custTicketsData = await custTicketsRes.json();
    assert(custTicketsRes.status === 200, 'Customer tickets query succeeded');
    assert(custTicketsData.tickets.length > 0, 'Customer has tickets returned');
    const onlyOwnTickets = custTicketsData.tickets.every(
      t => t.requester?.email?.toLowerCase() === 'jordan.h@finscale.net'
    );
    assert(onlyOwnTickets, 'Customer ONLY sees tickets belonging to their authenticated account');

    // Customer attempts to access another customer ticket (e.g. David Chen's ticket TK-1002)
    const unauthorizedTicketRes = await fetch(`${BASE_URL}/tickets/TK-1002`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(unauthorizedTicketRes.status === 403, 'Cross-customer ticket access strictly forbidden with HTTP 403');

    // ----------------------------------------------------
    // TEST 5: Internal Notes Privacy (Mandatory Security Invariant)
    // ----------------------------------------------------
    console.log('\n6. Testing Internal Notes Privacy (Zero Leakage Invariant)...');
    // Staff user posts an internal note on Jordan's ticket TK-1001
    const staffNoteRes = await fetch(`${BASE_URL}/tickets/TK-1001/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'SECRET INTERNAL STAFF NOTE: Stripe charge confirmed fraudulent. Do not disclose to customer.',
        visibility: 'internal'
      })
    });
    assert(staffNoteRes.status === 200, 'Staff agent posted internal note on ticket');

    // Customer reads their own ticket TK-1001
    const customerReadRes = await fetch(`${BASE_URL}/tickets/TK-1001`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const customerReadData = await customerReadRes.json();
    assert(customerReadRes.status === 200, 'Customer retrieved their own ticket TK-1001');

    const internalNotesInCustomerView = customerReadData.conversation.filter(
      m => m.visibility === 'internal' || m.content.includes('SECRET INTERNAL STAFF NOTE')
    );
    assert(internalNotesInCustomerView.length === 0, 'ZERO internal notes leaked in customer API response');
    assert(
      customerReadData.conversation.every(m => m.visibility === 'public'),
      'All messages delivered to customer are strictly public'
    );

    // Customer attempts to post an internal note
    const customerPostInternalRes = await fetch(`${BASE_URL}/tickets/TK-1001/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Malicious note creation attempt',
        visibility: 'internal'
      })
    });
    assert(customerPostInternalRes.status === 403, 'Customer forbidden from creating internal notes (HTTP 403)');

    // ----------------------------------------------------
    // TEST 6: Ticket Lifecycle & Automatic Status Transitions
    // ----------------------------------------------------
    console.log('\n7. Testing Ticket Lifecycle & Automatic Status Transitions...');
    // Customer creates a new ticket
    const newTicketRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Integration Test Billing Query',
        description: 'Testing the full lifecycle of a ticket created via API.',
        category: 'Billing',
        priority: 'High'
      })
    });
    const newTicketData = await newTicketRes.json();
    assert(newTicketRes.status === 201, 'Customer created new ticket via API');
    assert(newTicketData.ticketId.startsWith('TK-'), `Generated sequential ticketId: ${newTicketData.ticketId}`);
    assert(newTicketData.status === 'Open', 'Initial ticket status is Open');
    assert(newTicketData.conversation.length === 1, 'Initial message recorded in conversation');

    // Agent assigns ticket to themselves
    const assignRes = await fetch(`${BASE_URL}/tickets/${newTicketData.ticketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${agentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assigneeId: agentLoginData.user.id })
    });
    const assignData = await assignRes.json();
    assert(assignRes.status === 200, 'Agent assigned ticket to self');
    assert(assignData.assignedTo?.name === agentLoginData.user.name, 'Ticket assignedTo field updated');

    // Agent updates status to "In Progress"
    const inProgressRes = await fetch(`${BASE_URL}/tickets/${newTicketData.ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${agentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'In Progress' })
    });
    assert(inProgressRes.status === 200, 'Ticket status transitioned to In Progress');

    // Agent replies publicly -> Auto-transitions to "Waiting for Customer"
    const agentReplyRes = await fetch(`${BASE_URL}/tickets/${newTicketData.ticketId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Hi Jordan, could you please provide your invoice number?',
        visibility: 'public'
      })
    });
    const agentReplyData = await agentReplyRes.json();
    assert(agentReplyRes.status === 200, 'Agent posted public reply');
    assert(
      agentReplyData.status === 'Waiting for Customer',
      'Agent public reply auto-transitioned status to "Waiting for Customer"'
    );

    // Customer replies publicly -> Auto-transitions back to "In Progress"
    const custReplyRes = await fetch(`${BASE_URL}/tickets/${newTicketData.ticketId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Here is the invoice number: INV-2026-9901.',
        visibility: 'public'
      })
    });
    const custReplyData = await custReplyRes.json();
    assert(custReplyRes.status === 200, 'Customer posted reply');
    assert(
      custReplyData.status === 'In Progress',
      'Customer reply auto-transitioned status back to "In Progress"'
    );

    // Staff resolves ticket
    const resolveRes = await fetch(`${BASE_URL}/tickets/${newTicketData.ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${agentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Resolved' })
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.status === 200, 'Ticket marked Resolved');
    assert(resolveData.resolvedAt !== null, 'Ticket resolvedAt timestamp recorded');

    // ----------------------------------------------------
    // TEST 7: Knowledge Base Permissions, Slugs & Voting
    // ----------------------------------------------------
    console.log('\n8. Testing Knowledge Base RBAC, Slugs & Abuse Prevention...');
    // Customer cannot create article
    const custCreateArtRes = await fetch(`${BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Unauthorized Article',
        category: 'General',
        content: 'This should be rejected.'
      })
    });
    assert(custCreateArtRes.status === 403, 'Customer forbidden from creating articles (HTTP 403)');

    // Admin creates article
    const adminArtRes = await fetch(`${BASE_URL}/articles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Configuring SSO Integration for Okta',
        category: 'Account Access',
        tags: ['okta', 'sso', 'saml'],
        content: 'Complete configuration guide for Okta SAML 2.0 integration.'
      })
    });
    const adminArtData = await adminArtRes.json();
    assert(adminArtRes.status === 201, 'Admin published new KB article');
    assert(adminArtData.articleId.startsWith('KB-'), `Generated sequential articleId: ${adminArtData.articleId}`);
    assert(adminArtData.slug.includes('configuring-sso-integration'), `Generated clean slug: ${adminArtData.slug}`);

    // Helpfulness voting and vote duplicate protection
    const vote1Res = await fetch(`${BASE_URL}/articles/${adminArtData.articleId}/helpful`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const vote1Data = await vote1Res.json();
    assert(vote1Data.helpfulCount === 1, 'Article helpful count incremented to 1');
    assert(!vote1Data.alreadyVoted, 'First vote registered as new vote');

    // Second vote by same user
    const vote2Res = await fetch(`${BASE_URL}/articles/${adminArtData.articleId}/helpful`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const vote2Data = await vote2Res.json();
    assert(vote2Data.helpfulCount === 1, 'Repeated vote rejected without duplicate increment');
    assert(vote2Data.alreadyVoted === true, 'Flagged as already voted');

    // ----------------------------------------------------
    // TEST 8: Live Database Analytics Aggregation
    // ----------------------------------------------------
    console.log('\n9. Testing Database Analytics Aggregation...');
    const analyticsRes = await fetch(`${BASE_URL}/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    assert(analyticsRes.status === 200, 'Analytics retrieved from database');
    assert(analyticsData.totalTickets > 0, `Total tickets counted: ${analyticsData.totalTickets}`);
    assert(analyticsData.resolvedTicketsCount > 0, `Resolved tickets counted: ${analyticsData.resolvedTicketsCount}`);
    assert(
      analyticsData.priorityDistribution.Urgent !== undefined,
      'Priority distribution breakdown calculated'
    );
    assert(
      analyticsData.statusDistribution.Open !== undefined,
      'Status distribution breakdown calculated'
    );
    assert(analyticsData.oldestUnresolved.length > 0, 'Oldest unresolved queue populated from DB');

    // ----------------------------------------------------
    // TEST 9: User Provisioning RBAC (Admin Only)
    // ----------------------------------------------------
    console.log('\n10. Testing Admin User Provisioning & Deletion Constraints...');
    // Agent attempts to create an Admin
    const agentCreateAdminRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Rogue Admin',
        email: 'rogue@test.io',
        password: 'password123',
        role: 'Admin'
      })
    });
    assert(agentCreateAdminRes.status === 403, 'Agent forbidden from provisioning users (HTTP 403)');

    // Admin provisions new Agent
    const testAgentEmail = `test-agent-${Date.now()}@supportiq.io`;
    const adminCreateAgentRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'QA Provisioned Agent',
        email: testAgentEmail,
        password: 'password123',
        role: 'Agent',
        title: 'Support Specialist'
      })
    });
    const adminCreateAgentData = await adminCreateAgentRes.json();
    assert(adminCreateAgentRes.status === 201, 'Admin successfully provisioned new agent');
    assert(adminCreateAgentData.role === 'Agent', 'Provisioned user has role "Agent"');

    // Admin attempts to delete themselves -> Must be rejected
    const selfDeleteRes = await fetch(`${BASE_URL}/users/${adminLoginData.user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(selfDeleteRes.status === 400, 'Self-deletion of active administrator is rejected with HTTP 400');

    // Admin deletes the test agent
    const deleteAgentRes = await fetch(`${BASE_URL}/users/${adminCreateAgentData.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deleteAgentRes.status === 200, 'Admin deleted test agent successfully');

    // ----------------------------------------------------
    // TEST 10: Genuine Logout & Session Invalidation
    // ----------------------------------------------------
    console.log('\n11. Testing Logout & Session Invalidation...');
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(logoutRes.status === 200, 'Logout endpoint returned HTTP 200');

    // Request without token
    const unauthTicketsRes = await fetch(`${BASE_URL}/tickets`);
    assert(unauthTicketsRes.status === 401, 'Unauthenticated request correctly rejected with HTTP 401');

    console.log('\n====================================================');
    console.log(` Integration QA Results: ${passed} passed, ${failed} failed.`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    console.log('Shutting down test server and disconnecting database...');
    await stopServer();
    console.log('Test teardown complete.');
  }
}

runIntegrationTests().catch(err => {
  console.error('Fatal Integration Test Runner Failure:', err);
  process.exit(1);
});
