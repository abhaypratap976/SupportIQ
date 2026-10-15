// Automated verification test runner for SupportIQ core services, RBAC, Login, & AI assistance

import { storageService } from './src/services/storageService.js';
import { ticketService } from './src/services/ticketService.js';
import { articleService } from './src/services/articleService.js';
import { aiService } from './src/services/aiService.js';
import { userService } from './src/services/userService.js';
import { SEED_TICKETS, SEED_ARTICLES, DEMO_USERS } from './src/data/seedData.js';

// Polyfill localStorage in Node.js environment for verification
const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

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

async function runTests() {
  console.log('====================================================');
  console.log(' SupportIQ Extended QA Test Suite (RBAC, Auth, AI)');
  console.log('====================================================\n');

  // Test 1: Storage Initialization & Seed Data
  console.log('1. Testing Storage Initialization & Seed Data...');
  const initData = storageService.initializeStorage(true);
  assert(initData.tickets.length >= 6, `Seed tickets count (${initData.tickets.length}) >= 6`);
  assert(initData.articles.length >= 4, `Seed articles count (${initData.articles.length}) >= 4`);
  assert(initData.currentUser.role === 'Admin', 'Default demo user is Admin');

  // Test 2: Ticket Retrieval & Querying
  console.log('\n2. Testing Ticket Retrieval & Queries...');
  const allTickets = await ticketService.getAll();
  assert(allTickets.length >= 6, 'ticketService.getAll() returns tickets list');
  const t1 = await ticketService.getById('TK-1001');
  assert(t1 !== null && t1.id === 'TK-1001', 'ticketService.getById("TK-1001") retrieves correct ticket');
  assert(t1.category === 'Technical Issue', 'TK-1001 category matches Technical Issue');

  // Test 3: Analytics Math & Calculation
  console.log('\n3. Testing Analytics & Statistics Calculation...');
  const stats = ticketService.calculateAnalytics(allTickets);
  assert(stats.totalTickets === allTickets.length, 'Total tickets count matches stored tickets');
  assert(stats.totalOpenTickets > 0, `Total open tickets (${stats.totalOpenTickets}) calculated`);
  assert(stats.highPriorityTicketsCount > 0, `High priority tickets (${stats.highPriorityTicketsCount}) counted`);
  assert(stats.waitingForCustomerCount > 0, `Waiting for customer tickets (${stats.waitingForCustomerCount}) counted`);
  assert(stats.resolvedTicketsCount > 0, `Resolved tickets (${stats.resolvedTicketsCount}) counted`);
  assert(stats.oldestUnresolved.length > 0, 'Oldest unresolved queue is populated');
  assert(stats.oldestUnresolved[0].id === 'TK-1001', 'TK-1001 is correctly identified as oldest unresolved ticket');
  assert(stats.resolvedTicketsCount + stats.totalOpenTickets === stats.totalTickets, 'Resolved + Open equals Total');

  // Test 4: Ticket Creation with Validation
  console.log('\n4. Testing Ticket Creation & Validation...');
  try {
    await ticketService.create({ subject: '', description: '', category: '', priority: '' });
    assert(false, 'Should throw error when required fields are missing');
  } catch {
    assert(true, 'Validated required fields on ticket creation');
  }

  const createdTicket = await ticketService.create({
    subject: 'New test issue from QA suite',
    description: 'Detailed description of the test issue to verify ticket lifecycle.',
    category: 'Billing',
    priority: 'High',
    requester: {
      name: 'QA Test Bot',
      email: 'qa@supportiq.test',
      company: 'QA Labs'
    }
  });
  assert(createdTicket.id.startsWith('TK-'), `Created ticket generated valid ID: ${createdTicket.id}`);
  assert(createdTicket.status === 'Open', 'New ticket initial status is Open');
  assert(createdTicket.conversation.length === 1, 'Initial ticket description recorded in conversation timeline');
  assert(await ticketService.getById(createdTicket.id) !== null, 'Created ticket persisted to storage');

  // Test 5: Ticket Mutations (Status, Priority, Assignee)
  console.log('\n5. Testing Ticket Mutations...');
  const updatedStatus = await ticketService.updateStatus(createdTicket.id, 'In Progress');
  assert(updatedStatus.status === 'In Progress', 'Status successfully changed to In Progress');

  const updatedPriority = await ticketService.updatePriority(createdTicket.id, 'Urgent');
  assert(updatedPriority.priority === 'Urgent', 'Priority successfully changed to Urgent');

  const testAgent = DEMO_USERS.find(u => u.role === 'Agent');
  const updatedAssignee = await ticketService.assignTicket(createdTicket.id, testAgent);
  assert(updatedAssignee.assignedTo?.name === testAgent.name, `Ticket assigned to agent ${testAgent.name}`);

  // Test 6: Conversation Timeline (Public Reply & Private Internal Note)
  console.log('\n6. Testing Conversation Timeline & Internal Notes Privacy...');
  const updatedWithReply = await ticketService.addMessage(createdTicket.id, {
    author: { name: 'Alex Rivera', role: 'Agent', avatar: '' },
    content: 'Hello, we are actively looking into your billing charge.',
    visibility: 'public'
  });
  assert(updatedWithReply.conversation.length === 2, 'Public reply added to conversation');
  assert(updatedWithReply.status === 'Waiting for Customer', 'Public reply transitioned status to Waiting for Customer');

  const updatedWithNote = await ticketService.addMessage(createdTicket.id, {
    author: { name: 'Sarah Connor', role: 'Admin', avatar: '' },
    content: 'INTERNAL NOTE: Checked Stripe charge ID ch_194819. Refund approved.',
    visibility: 'internal'
  });
  assert(updatedWithNote.conversation.length === 3, 'Internal note added to conversation');
  const noteMessage = updatedWithNote.conversation.find(m => m.visibility === 'internal');
  assert(noteMessage !== undefined, 'Internal note correctly marked with visibility: "internal"');

  // Check customer privacy filter
  const customerViewMessages = updatedWithNote.conversation.filter(m => m.visibility === 'public');
  assert(customerViewMessages.length === 2, 'Customer view strictly excludes internal notes (2 public messages)');
  assert(!customerViewMessages.some(m => m.visibility === 'internal'), 'Zero internal notes present in customer view');

  // Test 7: Knowledge Base Operations
  console.log('\n7. Testing Knowledge Base Operations & Search...');
  const allArticles = await articleService.getAll();
  assert(allArticles.length >= 4, 'articleService.getAll() returns initial articles');
  
  // Search
  const searchResultsMFA = await articleService.search('mfa', 'All');
  assert(searchResultsMFA.length > 0, `Search for "mfa" returned ${searchResultsMFA.length} articles`);

  const categoryFilterBilling = await articleService.search('', 'Billing');
  assert(categoryFilterBilling.length > 0, `Category filter "Billing" returned ${categoryFilterBilling.length} articles`);

  // Create article
  const newArticle = await articleService.create({
    title: 'QA Knowledge Guide on Setting Up SSO',
    category: 'Account Access',
    tags: ['sso', 'saml', 'qa'],
    content: 'Complete guide on how to configure SAML single sign on.'
  });
  assert(newArticle.id.startsWith('KB-'), `New article created with ID: ${newArticle.id}`);
  assert(await articleService.getById(newArticle.id) !== null, 'New article retrieved from storage');

  // Update article
  const editedArticle = await articleService.update(newArticle.id, {
    title: 'Updated SSO Guide (v2)'
  });
  assert(editedArticle.title === 'Updated SSO Guide (v2)', 'Article title successfully updated');

  // Helpfulness
  const initialHelpful = editedArticle.helpfulCount || 0;
  const votedArticle = await articleService.markHelpful(newArticle.id);
  assert(votedArticle.helpfulCount === initialHelpful + 1, 'Article helpful count incremented');

  // Delete article
  await articleService.delete(newArticle.id);
  assert(await articleService.getById(newArticle.id) === null, 'Article successfully deleted');

  // Test 8: Authentication & User Registration (RBAC Rules)
  console.log('\n8. Testing User Authentication, Registration & RBAC Constraints...');
  // Valid login
  const loggedInUser = await userService.login('sarah.c@supportiq.io', 'password123');
  assert(loggedInUser.role === 'Admin', 'Admin logged in successfully with password');

  // Invalid login password
  try {
    await userService.login('sarah.c@supportiq.io', 'wrongpass');
    assert(false, 'Should throw error on wrong password');
  } catch {
    assert(true, 'Rejected invalid password');
  }

  // Customer self-registration - STRICT SECURITY REQUIREMENT:
  // "don't forget customer not able to create admin or agent roles ! and we able to create a new user."
  const newCustomer = await userService.registerCustomer({
    name: 'Self Registered User',
    email: 'new.cust@example.com',
    password: 'securepassword123',
    company: 'Self Co'
  });
  assert(newCustomer.role === 'Customer', 'Registered user was strictly provisioned with role = "Customer"');
  assert(await userService.getByEmail('new.cust@example.com') !== null, 'New customer persisted in user database');

  // Non-Admin cannot create staff roles
  try {
    await userService.createUserByAdmin(newCustomer, {
      name: 'Hacker User',
      email: 'hacker@test.io',
      password: 'password123',
      role: 'Admin'
    });
    assert(false, 'Customer should not be able to provision users via admin API');
  } catch (err) {
    assert(true, 'Access Denied: Customer prevented from provisioning Admin/Agent users');
  }

  // Admin CAN create Admin or Agent or Customer
  const newAgent = await userService.createUserByAdmin(loggedInUser, {
    name: 'New Agent Jane',
    email: 'jane.agent@supportiq.io',
    password: 'password123',
    role: 'Agent',
    title: 'Support Specialist'
  });
  assert(newAgent.role === 'Agent', 'Admin successfully provisioned a new Agent account');
  assert(await userService.getByEmail('jane.agent@supportiq.io') !== null, 'New agent persisted in storage');

  // Test 9: Expanded AI Assistance Suite
  console.log('\n9. Testing AI Assistant Suite (Summarize, Triage, Draft, Tone, Q&A)...');
  const summary = await aiService.summarizeTicket(t1);
  assert(summary.executiveSummary.length > 0, 'AI generated executive summary');

  const catSuggestion = await aiService.suggestCategory(t1);
  assert(catSuggestion.suggestedCategory === 'Technical Issue', `AI recommended category: ${catSuggestion.suggestedCategory}`);

  const prioSuggestion = await aiService.suggestPriority(t1);
  assert(prioSuggestion.suggestedPriority === 'Urgent', `AI recommended priority: ${prioSuggestion.suggestedPriority}`);

  const draft = await aiService.draftResponse(t1, 'Alex Rivera');
  assert(draft.draft.includes('Jordan') && draft.draft.includes('webhook'), 'AI generated response tailored to customer and issue');

  // AI Tone Rephraser
  const empatheticTone = await aiService.rephraseResponse(draft.draft, 'Empathetic');
  assert(empatheticTone.includes('truly sorry') || empatheticTone.includes('understand'), 'AI rephrased response in empathetic tone');

  // AI Article Generator
  const aiArticle = await aiService.generateArticle('Setting up OAuth 2.0 Webhook Verification', 'Troubleshooting');
  assert(aiArticle.content.includes('Step-by-Step Instructions'), 'AI drafted complete knowledge base guide');
  assert(aiArticle.tags.length > 0, 'AI generated tags for knowledge article');

  // AI Instant Q&A Deflection
  const qnaResponse = await aiService.askInstantHelp('How do I reset my lost MFA recovery code?', allArticles);
  assert(qnaResponse.answer.includes('MFA') || qnaResponse.answer.includes('recovery'), 'AI answered user query using KB context');
  assert(qnaResponse.confidence > 80, `AI Q&A confidence: ${qnaResponse.confidence}%`);

  // Test 10: Reset Demo Data
  console.log('\n10. Testing Demo Reset Functionality...');
  const resetResult = storageService.resetToDefaults();
  assert(resetResult.tickets.length === SEED_TICKETS.length, 'Reset restored original ticket count');
  assert(resetResult.articles.length === SEED_ARTICLES.length, 'Reset restored original articles count');

  console.log('\n====================================================');
  console.log(` Results: ${passed} passed, ${failed} failed.`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});
