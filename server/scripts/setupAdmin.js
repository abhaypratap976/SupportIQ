import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

dotenv.config();

/**
 * Setup or reset the initial Administrator account using environment variables:
 * - ADMIN_NAME
 * - ADMIN_EMAIL
 * - ADMIN_PASSWORD
 */
async function setupAdmin() {
  const name = process.env.ADMIN_NAME || process.argv[2];
  const email = process.env.ADMIN_EMAIL || process.argv[3];
  const password = process.env.ADMIN_PASSWORD || process.argv[4];

  if (!email || !password) {
    console.error('Error: Administrator credentials missing.');
    console.error('Usage: ADMIN_NAME="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." node server/scripts/setupAdmin.js');
    console.error('Or provide CLI arguments: node server/scripts/setupAdmin.js "Name" "email@domain.com" "password"');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Administrator password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    await connectDB();
    const cleanEmail = email.toLowerCase().trim();

    let admin = await User.findOne({ email: cleanEmail });
    if (admin) {
      console.log(`[Admin Setup] Updating existing user "${cleanEmail}" to Administrator...`);
      admin.role = 'Admin';
      admin.password = password;
      if (name) admin.name = name.trim();
      await admin.save();
      console.log(`[Admin Setup] Successfully updated Administrator "${cleanEmail}".`);
    } else {
      console.log(`[Admin Setup] Creating new Administrator "${cleanEmail}"...`);
      admin = new User({
        name: (name || 'System Administrator').trim(),
        email: cleanEmail,
        password,
        role: 'Admin',
        title: 'Lead Administrator',
        company: 'SupportIQ Team',
        status: 'Active'
      });
      await admin.save();
      console.log(`[Admin Setup] Successfully created Administrator "${cleanEmail}".`);
    }

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Admin Setup] Failed to configure administrator:', err.message);
    process.exit(1);
  }
}

setupAdmin();
