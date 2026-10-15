import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { TicketMessage } from '../models/TicketMessage.js';
import { Article, slugifyTitle } from '../models/Article.js';
import { DEMO_USERS, SEED_TICKETS, SEED_ARTICLES } from '../../src/data/seedData.js';
import { getInitialsDataUri } from '../../src/utils/avatarUtils.js';

export async function seedDatabase(force = false) {
  await connectDB();

  const userCount = await User.countDocuments();
  if (userCount > 0 && !force) {
    console.log('[Seed] Database already contains records. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with initial SupportIQ data...');

  // Clear existing if force
  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Ticket.deleteMany({}),
      TicketMessage.deleteMany({}),
      Article.deleteMany({})
    ]);
  }

  // 1. Seed Users
  const userMap = new Map(); // email -> User doc
  for (const u of DEMO_USERS) {
    let user = await User.findOne({ email: u.email.toLowerCase() });
    if (!user) {
      user = new User({
        name: u.name,
        email: u.email.toLowerCase(),
        password: u.password || 'password123',
        role: u.role,
        title: u.title || '',
        company: u.company || (u.role === 'Customer' ? 'Direct Customer' : 'SupportIQ Team'),
        avatar: u.avatar || getInitialsDataUri(u.name),
        status: 'Active'
      });
      await user.save();
    }
    userMap.set(u.email.toLowerCase(), user);
  }
  console.log(`[Seed] Seeded ${userMap.size} users.`);

  // 2. Seed Articles
  let articleCount = 0;
  for (const a of SEED_ARTICLES) {
    const existing = await Article.findOne({ articleId: a.id });
    if (!existing) {
      const slug = slugifyTitle(a.title);
      const article = new Article({
        articleId: a.id,
        title: a.title,
        slug,
        category: a.category,
        tags: a.tags || [],
        summary: a.summary,
        content: a.content,
        authorName: a.author || 'Admin',
        helpfulCount: a.helpfulCount || 0,
        status: 'published',
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
        updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date()
      });
      await article.save();
      articleCount++;
    }
  }
  console.log(`[Seed] Seeded ${articleCount} articles.`);

  // 3. Seed Tickets & Messages
  let ticketCount = 0;
  for (const t of SEED_TICKETS) {
    const existing = await Ticket.findOne({ ticketId: t.id });
    if (!existing) {
      // Find or create customer
      const custEmail = t.requester?.email?.toLowerCase();
      let customer = userMap.get(custEmail);
      if (!customer && custEmail) {
        customer = new User({
          name: t.requester.name,
          email: custEmail,
          password: 'password123',
          role: 'Customer',
          company: t.requester.company || 'Direct Customer',
          avatar: t.requester.avatar
        });
        await customer.save();
        userMap.set(custEmail, customer);
      }

      // Find assigned agent
      let assignedUser = null;
      if (t.assignedTo?.email) {
        assignedUser = userMap.get(t.assignedTo.email.toLowerCase());
      }

      const ticket = new Ticket({
        ticketId: t.id,
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        customer: customer ? customer._id : userMap.values().next().value._id,
        assignedTo: assignedUser ? assignedUser._id : null,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        resolvedAt: t.status === 'Resolved' ? (t.updatedAt ? new Date(t.updatedAt) : new Date()) : null
      });
      await ticket.save();
      ticketCount++;

      // Seed ticket messages
      if (Array.isArray(t.conversation)) {
        for (const msg of t.conversation) {
          const authorRole = msg.author?.role || 'Customer';
          // Find matching author user
          let authorUser = null;
          if (authorRole === 'Customer' && customer) {
            authorUser = customer;
          } else {
            // Find staff user
            for (const u of userMap.values()) {
              if (u.name === msg.author?.name || u.role === authorRole) {
                authorUser = u;
                break;
              }
            }
          }
          if (!authorUser) {
            authorUser = userMap.values().next().value;
          }

          const ticketMessage = new TicketMessage({
            ticket: ticket._id,
            author: authorUser._id,
            content: msg.content,
            visibility: msg.visibility === 'internal' ? 'internal' : 'public',
            createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
          });
          await ticketMessage.save();
        }
      }
    }
  }
  console.log(`[Seed] Seeded ${ticketCount} tickets.`);
  console.log('[Seed] Seeding completed successfully.');
}

// Allow direct CLI execution: node server/scripts/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(true)
    .then(() => {
      console.log('[Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error seeding database:', err);
      process.exit(1);
    });
}
