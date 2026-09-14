import mongoose from 'mongoose';

// Fail fast on buffering when DB is offline
mongoose.set('bufferCommands', false);

let mongodInstance: any = null;

export async function connectDB(): Promise<typeof mongoose> {
  // 1. Connection pooling for serverless (Vercel) / reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
    return mongoose;
  }

  const mongoURI = process.env.MONGO_URI;
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

  // 2. In production or Vercel, MONGO_URI is required and strictly used
  if (isProduction) {
    if (!mongoURI || mongoURI.trim() === '') {
      throw new Error(
        'MONGO_URI environment variable is required in production / Vercel. Please set MONGO_URI in your environment settings (e.g. MongoDB Atlas connection string).'
      );
    }
    console.log('[FreelanceFlow DB] Connecting to production MongoDB...');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[FreelanceFlow DB] Connected to production MongoDB successfully.');
    return mongoose;
  }

  // 3. In development / testing: connect to MONGO_URI if provided
  if (mongoURI && mongoURI.trim() !== '') {
    try {
      console.log('[FreelanceFlow DB] Connecting to provided MongoDB URI...');
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('[FreelanceFlow DB] Connected to MongoDB successfully.');
      return mongoose;
    } catch (err) {
      console.warn('[FreelanceFlow DB] Notice: Provided MONGO_URI unreachable, falling back to in-memory instance:', err);
    }
  }

  // 4. In-memory Mongo server fallback for local / sandbox development
  try {
    if (!mongodInstance) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
    }
    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log(`[FreelanceFlow DB] Connected to in-memory MongoDB (${uri}).`);
    return mongoose;
  } catch (fallbackErr) {
    console.error('[FreelanceFlow DB] Fatal: Could not initialize database:', fallbackErr);
    throw fallbackErr;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
}

