import mongoose from 'mongoose';
import { config } from '../config/index';
import { User } from '../models/index';

const uriPlaceholder = 'PASTE_YOUR_MONGODB_ATLAS_CONNECTION_STRING_HERE';
type MongoGlobal = typeof globalThis & {
  taskAntMongoConnection?: Promise<typeof mongoose>;
};

function getConnectionPromise(): Promise<typeof mongoose> {
  const globalWithCache = globalThis as MongoGlobal;
  if (!globalWithCache.taskAntMongoConnection) {
    globalWithCache.taskAntMongoConnection = mongoose
      .connect(config.mongoUri, { autoIndex: false })
      .then(async (connection) => {
        await User.createIndexes();
        return connection;
      })
      .catch((error: unknown) => {
        globalWithCache.taskAntMongoConnection = undefined;
        throw error;
      });
  }
  return globalWithCache.taskAntMongoConnection;
}

export function isMongoConfigured(): boolean {
  return Boolean(config.mongoUri) && config.mongoUri !== uriPlaceholder;
}

export async function connectMongo(): Promise<void> {
  if (!isMongoConfigured()) {
    throw new Error('MONGODB_URI is not configured.');
  }
  await getConnectionPromise();
}

export async function checkMongoConnection(): Promise<void> {
  await connectMongo();
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB application connection is not ready.');
  }
  await mongoose.connection.db.command({ ping: 1 });
}
