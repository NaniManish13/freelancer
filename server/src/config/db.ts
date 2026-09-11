import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  const mongoURI = process.env.MONGO_URI;

  try {
    if (mongoURI && !mongoURI.includes('localhost:27017')) {
      console.log('Connecting to provided MongoDB URI...');
      await mongoose.connect(mongoURI);
      console.log('Connected to MongoDB successfully.');
      return mongoose;
    }

    // Attempt direct local connection if configured
    if (mongoURI) {
      try {
        await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
        console.log('Connected to local MongoDB instance.');
        return mongoose;
      } catch {
        console.log('Local MongoDB not accessible. Initializing in-memory Mongo server...');
      }
    }

    // In-memory Mongo server fallback for seamless out-of-the-box local/cloud run execution
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`Connected to in-memory MongoDB (${uri}).`);
    return mongoose;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // If external Mongo fails, try in-memory server as last resilience layer
    if (!mongod) {
      try {
        console.log('Attempting fallback to in-memory MongoDB...');
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log('Fallback in-memory MongoDB connected successfully.');
        return mongoose;
      } catch (fallbackErr) {
        console.error('Fatal: Could not initialize database:', fallbackErr);
        throw fallbackErr;
      }
    }
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}
