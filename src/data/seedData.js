// Realistic seed data for SupportIQ
// Timestamps are dynamically computed relative to current time so demo always looks fresh and realistic

const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

export const DEMO_USERS = [
  {
    id: 'user-admin',
    name: 'Sarah Connor',
    email: 'sarah.c@supportiq.io',
    password: 'password123',
    role: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    title: 'Support Director'
  },
  {
    id: 'user-agent-1',
    name: 'Alex Rivera',
    email: 'alex.r@supportiq.io',
    password: 'password123',
    role: 'Agent',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    title: 'Senior Support Engineer'
  },
  {
    id: 'user-agent-2',
    name: 'Marcus Vance',
    email: 'marcus.v@supportiq.io',
    password: 'password123',
    role: 'Agent',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    title: 'Technical Support Lead'
  },
  {
    id: 'user-agent-3',
    name: 'Elena Rostova',
    email: 'elena.r@supportiq.io',
    password: 'password123',
    role: 'Agent',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    title: 'Billing & Account Specialist'
  },
  {
    id: 'cust-1',
    name: 'David Chen',
    email: 'david.chen@acmecorp.com',
    password: 'password123',
    role: 'Customer',
    company: 'Acme Corp (Enterprise)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'cust-2',
    name: 'Maya Lin',
    email: 'maya@quantumdesign.io',
    password: 'password123',
    role: 'Customer',
    company: 'Quantum Design',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'cust-3',
    name: 'Jordan Hayes',
    email: 'jordan.h@finscale.net',
    password: 'password123',
    role: 'Customer',
    company: 'FinScale Solutions',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
  },
  {
    id: 'cust-4',
    name: 'Emily Watson',
    email: 'emily.w@zenithlabs.org',
    password: 'password123',
    role: 'Customer',
    company: 'Zenith Labs',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
  }
];

export const CATEGORIES = [
  'Technical Issue',
  'Billing',
  'Account Access',
  'Feature Request',
  'General Inquiry'
];

export const STATUSES = [
  'Open',
  'In Progress',
  'Waiting for Customer',
  'Resolved'
];

export const PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Urgent'
];

export const SEED_ARTICLES = [
  {
    id: 'KB-101',
    title: 'How to Reset Your Multi-Factor Authentication (MFA)',
    category: 'Account Access',
    tags: ['mfa', 'security', 'login', '2fa', 'password'],
    summary: 'Step-by-step guide on re-enrolling your authenticator app or using backup emergency recovery codes.',
    content: `### Overview
If you have lost access to your authenticator app or replaced your mobile device, you can reset your Multi-Factor Authentication (MFA) using either your one-time backup recovery codes or by contacting your workspace administrator.

### Method 1: Using Backup Recovery Codes
1. On the login screen, enter your registered email and password.
2. When prompted for the 6-digit authenticator code, click **"Use backup recovery key"** below the input field.
3. Paste one of the 10 emergency codes provided when you first set up MFA.
4. Once logged in, navigate immediately to **Account Settings > Security > MFA Configuration**.
5. Click **"Reset Authenticator App"** and scan the new QR code with Google Authenticator, Authy, or 1Password.

### Method 2: Requesting an Admin Reset
If you do not have your recovery codes:
- Contact your organization's SupportIQ admin.
- Admins can navigate to **Team Settings > Members**, select your profile, and click **Revoke MFA Device**.
- Upon your next login, you will be prompted to enroll a fresh device.

> **Security Note:** SupportIQ support personnel will never ask for your passwords or backup codes via email or chat.`,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(2),
    helpfulCount: 42,
    author: 'Sarah Connor'
  },
  {
    id: 'KB-102',
    title: 'Resolving Webhook Delivery & 504 Gateway Timeout Errors',
    category: 'Troubleshooting',
    tags: ['webhooks', 'api', '504', 'timeout', 'integration', 'latency'],
    summary: 'Diagnose webhook endpoint latency, automatic retries, and configuring acceptable SSL ciphers.',
    content: `### Understanding Webhook Timeouts
SupportIQ enforces a **5,000 millisecond (5s)** HTTP timeout on webhook receiver endpoints to maintain delivery queue throughput. If your server takes longer than 5 seconds to respond with a \`2xx\` HTTP status code, the delivery attempt is logged as failed with a \`504 Gateway Timeout\`.

### Recommended Actions
1. **Acknowledge Immediately:** Ensure your webhook listener acknowledges incoming payloads with an immediate \`HTTP 200 OK\` before queuing heavy processing or database transactions asynchronously (e.g., using Celery, BullMQ, or AWS SQS).
2. **Verify IP Allowlist:** Verify that your firewall or Cloudflare rules allow incoming connections from the SupportIQ outbound IP ranges:
   - \`52.14.88.0/24\`
   - \`54.218.102.16/28\`
3. **Check SSL Handshake:** Ensure your endpoint uses valid TLS 1.2 or 1.3 certificates signed by a trusted Certificate Authority. Self-signed certificates are rejected.
4. **Retry Schedule:** SupportIQ automatically retries failed events with exponential backoff at 1 minute, 5 minutes, 30 minutes, 2 hours, and 8 hours.`,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
    helpfulCount: 88,
    author: 'Alex Rivera'
  },
  {
    id: 'KB-103',
    title: 'Understanding Invoices, Billing Cycles, and Prorated Upgrades',
    category: 'Billing',
    tags: ['billing', 'invoice', 'seat-pricing', 'upgrade', 'refund', 'stripe'],
    summary: 'A detailed breakdown of monthly versus annual billing, mid-cycle seat additions, and downloading tax invoices.',
    content: `### Billing Cycle Basics
SupportIQ subscriptions renew on the same calendar day of each month (or year for annual commitments). Billing is automated via our secure payment gateway.

### Adding Team Seats Mid-Cycle
When you add new agents or admin seats in the middle of a billing cycle:
- You are charged a **prorated amount** for the new seat for the remainder of the current cycle.
- On your subsequent renewal date, all seats will be consolidated into a single renewal invoice.

### Downloading VAT and Tax Invoices
1. Go to **Settings > Billing & Plan**.
2. Scroll to the **Billing History** section.
3. Click the **PDF Invoice** button next to any statement.
4. To add custom VAT/Tax ID or company address to past and future receipts, click **Edit Billing Info**.

### Failed Payments
If an automatic charge fails, our system retries every 3 days for up to 4 attempts before placing the workspace in read-only grace period.`,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(10),
    helpfulCount: 56,
    author: 'Elena Rostova'
  },
  {
    id: 'KB-104',
    title: 'Configuring Custom Email Domains & DKIM/SPF Records',
    category: 'Product Usage',
    tags: ['email', 'dkim', 'spf', 'cname', 'custom-domain', 'smtp'],
    summary: 'Configure your company domain so ticket responses are sent directly from support@yourbrand.com.',
    content: `### Why Configure Custom Email?
By default, outgoing customer replies are sent from \`support@supportiq.io\`. Configuring custom DNS records allows replies to originate seamlessly from your verified corporate domain.

### Step-by-Step DNS Setup
Navigate to **Settings > Channels > Email Settings** and enter your desired outbound address (e.g., \`help@yourcompany.com\`). You will be provided with 3 DNS records:

| Type | Name / Host | Target / Value | Priority |
|---|---|---|---|
| TXT | \`@\` | \`v=spf1 include:mail.supportiq.io ~all\` | - |
| CNAME | \`siq._domainkey\` | \`dkim.supportiq.io\` | - |
| MX | \`support\` | \`inbound.supportiq.io\` | 10 |

### DNS Propagation
DNS updates typically propagate within 15 to 45 minutes, though some domain registrars may require up to 24 hours. Once the status shows a green **Verified** checkmark, all ticket threads will use your customized sender headers.`,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(12),
    helpfulCount: 67,
    author: 'Marcus Vance'
  },
  {
    id: 'KB-105',
    title: 'Setting Up SLA Policies and Automatic Ticket Escalation',
    category: 'Product Usage',
    tags: ['sla', 'escalation', 'automations', 'business-hours', 'rules'],
    summary: 'Define first response and resolution time targets based on priority and customer tier.',
    content: `### What are Service Level Agreements (SLAs)?
SLAs help your support team stay accountable to response time commitments. In SupportIQ, SLA timers start as soon as a customer creates a ticket or posts a reply.

### Default SLA Targets
- **Urgent Priority:** First Response within **1 hour**, Resolution within **4 hours** (24/7).
- **High Priority:** First Response within **4 hours**, Resolution within **12 business hours**.
- **Medium Priority:** First Response within **8 business hours**, Resolution within **24 business hours**.
- **Low Priority:** First Response within **24 business hours**.

### Escalation Triggers
When an SLA breach is imminent (80% of window elapsed), SupportIQ can trigger automated alerts to team leads and re-flag tickets in the main triage queue.`,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(8),
    helpfulCount: 31,
    author: 'Sarah Connor'
  }
];

export const SEED_TICKETS = [
  {
    id: 'TK-1001',
    subject: 'Production API webhook failures with 504 Gateway Timeout',
    description: 'Since 08:30 AM UTC today, our core webhook listener has been rejecting requests originating from SupportIQ webhook dispatchers with 504 Gateway Timeouts. We are missing critical customer sync events in our production database. Please check if your outbound IP routing changed.',
    category: 'Technical Issue',
    priority: 'Urgent',
    status: 'In Progress',
    requester: {
      name: 'Jordan Hayes',
      email: 'jordan.h@finscale.net',
      company: 'FinScale Solutions',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
    },
    assignedTo: {
      id: 'user-agent-1',
      name: 'Alex Rivera',
      email: 'alex.r@supportiq.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    createdAt: daysAgo(4.5), // Oldest unresolved ticket! 4.5 days
    updatedAt: hoursAgo(2),
    conversation: [
      {
        id: 'msg-1',
        author: {
          name: 'Jordan Hayes',
          role: 'Customer',
          avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'Since 08:30 AM UTC today, our core webhook listener has been rejecting requests originating from SupportIQ webhook dispatchers with 504 Gateway Timeouts. We are missing critical customer sync events in our production database. Please check if your outbound IP routing changed.',
        createdAt: daysAgo(4.5)
      },
      {
        id: 'msg-2',
        author: {
          name: 'Sarah Connor',
          role: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'internal',
        content: 'Assigning to Alex. FinScale is on our Enterprise Tier SLA with 1-hour urgent response guarantee. Let us check outbound cluster logs in region us-east-1.',
        createdAt: daysAgo(4.2)
      },
      {
        id: 'msg-3',
        author: {
          name: 'Alex Rivera',
          role: 'Agent',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'Hello Jordan, thank you for alerting us. I am investigating our webhook worker logs now. Our outbound IPs have not changed, but we notice your receiver endpoint is taking ~5.2 seconds to complete the TLS handshake and return the 200 OK. SupportIQ enforces a 5-second timeout. Could your team check your reverse proxy upstream buffering?',
        createdAt: daysAgo(3)
      },
      {
        id: 'msg-4',
        author: {
          name: 'Alex Rivera',
          role: 'Agent',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'internal',
        content: 'Followed up with DevOps: FinScales ALB had keep-alive settings misconfigured. They are rolling out a proxy restart right now.',
        createdAt: hoursAgo(2)
      }
    ]
  },
  {
    id: 'TK-1002',
    subject: 'Cannot login after replacing iPhone - MFA backup code lost',
    description: 'I recently upgraded to a new phone and did not transfer my Google Authenticator tokens. Now I cannot log in to my admin dashboard and I misplaced my one-time backup recovery codes. I am locked out of our company account.',
    category: 'Account Access',
    priority: 'High',
    status: 'Waiting for Customer',
    requester: {
      name: 'Maya Lin',
      email: 'maya@quantumdesign.io',
      company: 'Quantum Design',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
    },
    assignedTo: {
      id: 'user-agent-3',
      name: 'Elena Rostova',
      email: 'elena.r@supportiq.io',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
    },
    createdAt: daysAgo(2.5),
    updatedAt: hoursAgo(6),
    conversation: [
      {
        id: 'msg-10',
        author: {
          name: 'Maya Lin',
          role: 'Customer',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'I recently upgraded to a new phone and did not transfer my Google Authenticator tokens. Now I cannot log in to my admin dashboard and I misplaced my one-time backup recovery codes. I am locked out of our company account.',
        createdAt: daysAgo(2.5)
      },
      {
        id: 'msg-11',
        author: {
          name: 'Elena Rostova',
          role: 'Agent',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'internal',
        content: 'Per standard security verification protocol, verified domain WHOIS matches registered corporate email. Sent identity verification challenge link to primary phone on file.',
        createdAt: daysAgo(2)
      },
      {
        id: 'msg-12',
        author: {
          name: 'Elena Rostova',
          role: 'Agent',
          avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'Hi Maya, I understand how urgent this is. To protect your workspace security, I have dispatched an SMS verification code to your verified mobile number ending in *4910. Please reply with the 6-digit one-time code so we can safely reset your MFA device.',
        createdAt: hoursAgo(6)
      }
    ]
  },
  {
    id: 'TK-1003',
    subject: 'Unexpected invoice charge for 5 additional seats',
    description: 'We were billed $245 on yesterday’s statement for 5 extra agent seats, but our team only invited 2 temporary reviewers. We would like clarification on why 5 seats were billed and request a credit for the unused licenses.',
    category: 'Billing',
    priority: 'Medium',
    status: 'Open',
    requester: {
      name: 'David Chen',
      email: 'david.chen@acmecorp.com',
      company: 'Acme Corp (Enterprise)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    },
    assignedTo: null, // Unassigned to show triage flow
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(18),
    conversation: [
      {
        id: 'msg-20',
        author: {
          name: 'David Chen',
          role: 'Customer',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'We were billed $245 on yesterday’s statement for 5 extra agent seats, but our team only invited 2 temporary reviewers. We would like clarification on why 5 seats were billed and request a credit for the unused licenses.',
        createdAt: hoursAgo(18)
      }
    ]
  },
  {
    id: 'TK-1004',
    subject: 'Request for CSV export capability in audit logging',
    description: 'Our compliance department needs automated or monthly downloadable CSV export of all user activity and authentication logs for SOC2 compliance. Currently we can only view them in the web UI without bulk export.',
    category: 'Feature Request',
    priority: 'Low',
    status: 'In Progress',
    requester: {
      name: 'Emily Watson',
      email: 'emily.w@zenithlabs.org',
      company: 'Zenith Labs',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    },
    assignedTo: {
      id: 'user-agent-2',
      name: 'Marcus Vance',
      email: 'marcus.v@supportiq.io',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    createdAt: daysAgo(3.8),
    updatedAt: hoursAgo(10),
    conversation: [
      {
        id: 'msg-30',
        author: {
          name: 'Emily Watson',
          role: 'Customer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'Our compliance department needs automated or monthly downloadable CSV export of all user activity and authentication logs for SOC2 compliance. Currently we can only view them in the web UI without bulk export.',
        createdAt: daysAgo(3.8)
      },
      {
        id: 'msg-31',
        author: {
          name: 'Marcus Vance',
          role: 'Agent',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'internal',
        content: 'Product team has this in the Q4 roadmap under JIRA-4091. Mentioned to Product Manager that 3 enterprise customers have requested this recently.',
        createdAt: daysAgo(2)
      },
      {
        id: 'msg-32',
        author: {
          name: 'Marcus Vance',
          role: 'Agent',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'Hi Emily, thank you for sharing your compliance requirements. I have linked this ticket directly to our Engineering feature ticket (JIRA-4091). Audit log CSV export is currently in active staging testing and scheduled for general release in our upcoming sprint. I will notify you as soon as the release is live.',
        createdAt: hoursAgo(10)
      }
    ]
  },
  {
    id: 'TK-1005',
    subject: 'Custom domain DKIM verification pending over 48 hours',
    description: 'We added the DNS TXT and CNAME records for help.acmecorp.com over two days ago, but the SupportIQ admin dashboard still shows "Verification Pending". Outgoing emails are failing SPF alignment.',
    category: 'Technical Issue',
    priority: 'High',
    status: 'Open',
    requester: {
      name: 'David Chen',
      email: 'david.chen@acmecorp.com',
      company: 'Acme Corp (Enterprise)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    },
    assignedTo: {
      id: 'user-agent-1',
      name: 'Alex Rivera',
      email: 'alex.r@supportiq.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(4),
    conversation: [
      {
        id: 'msg-40',
        author: {
          name: 'David Chen',
          role: 'Customer',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'We added the DNS TXT and CNAME records for help.acmecorp.com over two days ago, but the SupportIQ admin dashboard still shows "Verification Pending". Outgoing emails are failing SPF alignment.',
        createdAt: hoursAgo(8)
      },
      {
        id: 'msg-41',
        author: {
          name: 'Alex Rivera',
          role: 'Agent',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'internal',
        content: 'Checked \`dig help.acmecorp.com TXT\` via Google DNS. Notice they entered quotes around the DKIM key string, causing double quoting in AWS Route53.',
        createdAt: hoursAgo(4)
      }
    ]
  },
  {
    id: 'TK-1006',
    subject: 'Inquiry regarding EU GDPR Data Processing Agreement (DPA)',
    description: 'Our legal counsel is conducting an annual vendor assessment. Could you provide a countersigned copy of your Standard Contractual Clauses (SCCs) and GDPR Data Processing Agreement?',
    category: 'General Inquiry',
    priority: 'Low',
    status: 'Resolved',
    requester: {
      name: 'Emily Watson',
      email: 'emily.w@zenithlabs.org',
      company: 'Zenith Labs',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    },
    assignedTo: {
      id: 'user-admin',
      name: 'Sarah Connor',
      email: 'sarah.c@supportiq.io',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    },
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    conversation: [
      {
        id: 'msg-50',
        author: {
          name: 'Emily Watson',
          role: 'Customer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'Our legal counsel is conducting an annual vendor assessment. Could you provide a countersigned copy of your Standard Contractual Clauses (SCCs) and GDPR Data Processing Agreement?',
        createdAt: daysAgo(5)
      },
      {
        id: 'msg-51',
        author: {
          name: 'Sarah Connor',
          role: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'Hello Emily, I have attached our pre-executed Data Processing Addendum incorporating the standard contractual clauses (SCCs) approved by the European Commission. You can review and countersign via DocuSign at your convenience. Let us know if you need anything else!',
        createdAt: daysAgo(1.5)
      },
      {
        id: 'msg-52',
        author: {
          name: 'Emily Watson',
          role: 'Customer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'All signed and received. Thank you Sarah for the prompt assistance!',
        createdAt: daysAgo(1.1)
      },
      {
        id: 'msg-53',
        author: {
          name: 'Sarah Connor',
          role: 'Admin',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'internal',
        content: 'Customer confirmed DPA executed. Closing ticket as resolved.',
        createdAt: daysAgo(1)
      }
    ]
  },
  {
    id: 'TK-1007',
    subject: 'Cannot invite new team member with special characters in email',
    description: 'We are attempting to invite a new developer whose email contains a plus sign tag (e.g., dev+analytics@company.com), but the invitation modal fails with an invalid email format validation error.',
    category: 'Technical Issue',
    priority: 'Medium',
    status: 'Open',
    requester: {
      name: 'Jordan Hayes',
      email: 'jordan.h@finscale.net',
      company: 'FinScale Solutions',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
    },
    assignedTo: null,
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
    conversation: [
      {
        id: 'msg-60',
        author: {
          name: 'Jordan Hayes',
          role: 'Customer',
          avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
        },
        visibility: 'public',
        content: 'We are attempting to invite a new developer whose email contains a plus sign tag (e.g., dev+analytics@company.com), but the invitation modal fails with an invalid email format validation error.',
        createdAt: hoursAgo(3)
      }
    ]
  }
];
