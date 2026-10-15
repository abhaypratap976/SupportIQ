import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isMemoryServer = false;
let memoryServerInstance = null;

/**
 * Connect to MongoDB database
 * Uses MONGODB_URI environment variable if available.
 * If not available or connection fails in development/test,
 * gracefully falls back to MongoMemoryServer so the app runs out-of-the-box.
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (uri) {
    const hasPlaceholder = uri.includes('<db_password>') || uri.includes('<password>');
    if (hasPlaceholder) {
      console.warn('--------------------------------------------------');
      console.warn('[Database] WARNING: MongoDB URI contains placeholder "<db_password>" or "<password>"!');
      console.warn('[Database] Please replace "<db_password>" with your actual MongoDB user password in Render Environment settings.');
      console.warn('--------------------------------------------------');
    } else {
      try {
        console.log('[Database] Connecting to configured MongoDB URI...');
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000
        });
        console.log('[Database] Connected to MongoDB successfully.');
        return mongoose.connection;
      } catch (err) {
        console.warn(`[Database] Failed to connect to MongoDB URI: ${err.message}`);
        console.log('[Database] Falling back to embedded MongoMemoryServer so the server stays online...');
      }
    }
  }

  // Fallback to MongoMemoryServer for reliable development and testing
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
    const memUri = memoryServerInstance.getUri();
    isMemoryServer = true;
    console.log(`[Database] Starting embedded MongoMemoryServer at ${memUri}...`);
    await mongoose.connect(memUri);
    console.log('[Database] Connected to embedded MongoMemoryServer successfully.');
    return mongoose.connection;
  } catch (err) {
    console.error('[Database] Fatal: Unable to initialize any MongoDB connection:', err);
    throw err;
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB.');
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
    console.log('[Database] Stopped embedded MongoMemoryServer.');
  }
}

export function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    isMemoryServer,
    databaseName: mongoose.connection.name || 'supportiq'
  };
}
