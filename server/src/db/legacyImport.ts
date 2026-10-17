import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';
import { config } from '../config/index';
import {
  Bid,
  Message,
  Notification,
  Payment,
  Report,
  Review,
  Task,
  User,
  Verification,
} from '../models/index';

// The same importer handles all of the differently typed application models.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedModel = Model<any>;

type LegacyCollection =
  | 'users'
  | 'tasks'
  | 'bids'
  | 'messages'
  | 'notifications'
  | 'payments'
  | 'reviews'
  | 'verifications'
  | 'reports';

type LegacyStore = Record<LegacyCollection, Record<string, unknown>[]>;

const collections: Array<{ key: LegacyCollection; model: UntypedModel }> = [
  { key: 'users', model: User },
  { key: 'tasks', model: Task },
  { key: 'bids', model: Bid },
  { key: 'messages', model: Message },
  { key: 'notifications', model: Notification },
  { key: 'payments', model: Payment },
  { key: 'reviews', model: Review },
  { key: 'verifications', model: Verification },
  { key: 'reports', model: Report },
];

const references: Partial<Record<LegacyCollection, string[]>> = {
  tasks: ['posterId', 'workerId', 'acceptedBidId'],
  bids: ['taskId', 'bidderId'],
  messages: ['taskId', 'senderId', 'receiverId'],
  notifications: ['userId'],
  payments: ['taskId', 'payerId', 'payeeId'],
  reviews: ['taskId', 'reviewerId', 'revieweeId'],
  verifications: ['userId'],
  reports: ['reporterId', 'relatedUserId', 'relatedTaskId'],
};

function makeIdMap(store: LegacyStore): Map<string, mongoose.Types.ObjectId> {
  const ids = new Map<string, mongoose.Types.ObjectId>();
  for (const { key } of collections) {
    for (const record of store[key] ?? []) {
      const oldId = record._id;
      if (typeof oldId === 'string' && !ids.has(oldId)) {
        ids.set(oldId, new mongoose.Types.ObjectId());
      }
    }
  }
  return ids;
}

function mapDocuments(
  key: LegacyCollection,
  rows: Record<string, unknown>[],
  ids: Map<string, mongoose.Types.ObjectId>
): Record<string, unknown>[] {
  return rows.map((row) => {
    const mapped: Record<string, unknown> = { ...row };
    const originalId = row._id;
    if (typeof originalId === 'string') {
      mapped._id = ids.get(originalId) ?? new mongoose.Types.ObjectId();
    } else {
      mapped._id = new mongoose.Types.ObjectId();
    }
    for (const field of references[key] ?? []) {
      const value = row[field];
      if (typeof value === 'string') {
        if (!ids.has(value)) ids.set(value, new mongoose.Types.ObjectId());
        mapped[field] = ids.get(value);
      }
    }
    return mapped;
  });
}

async function isCompletelyEmpty(session?: mongoose.ClientSession): Promise<boolean> {
  const counts = await Promise.all(
    collections.map(({ model }) => model.countDocuments({}).session(session ?? null))
  );
  return counts.every((count) => count === 0);
}

export async function importLegacyStoreIfMongoEmpty(): Promise<void> {
  if (
    config.nodeEnv !== 'development' ||
    process.env.TASKANT_IMPORT_LEGACY_DATA !== 'true' ||
    process.env.VERCEL_ENV === 'production'
  ) {
    return;
  }

  const storePath = path.join(process.cwd(), 'server', 'data', 'store.json');
  if (!fs.existsSync(storePath) || !(await isCompletelyEmpty())) return;

  let legacy: LegacyStore;
  try {
    legacy = JSON.parse(fs.readFileSync(storePath, 'utf8')) as LegacyStore;
  } catch {
    throw new Error('Legacy TaskAnt data could not be read; MongoDB was not modified.');
  }

  const hasRecords = collections.some(({ key }) => (legacy[key] ?? []).length > 0);
  if (!hasRecords) return;

  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB is not ready for the legacy import.');
  const lockCollection = db.collection('_taskant_legacy_import_lock');
  const lockId = new mongoose.Types.ObjectId('7461736b616e746c6f636b31');
  const owner = randomUUID();
  let acquired = false;

  try {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        await lockCollection.insertOne({
          _id: lockId,
          owner,
          createdAt: new Date(),
        });
        acquired = true;
        break;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        if (!(await isCompletelyEmpty())) return;
        const lock = await lockCollection.findOne({ _id: lockId });
        const createdAt = lock?.createdAt;
        if (
          lock &&
          createdAt instanceof Date &&
          Date.now() - createdAt.getTime() > 10 * 60 * 1000
        ) {
          await lockCollection.deleteOne({
            _id: lockId,
            owner: lock.owner,
            createdAt,
          });
          continue;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    if (!acquired) {
      throw new Error('Another legacy import is still in progress; retry API initialization.');
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (!(await isCompletelyEmpty(session))) return;
        const ids = makeIdMap(legacy);
        for (const { key, model } of collections) {
          const rows = legacy[key] ?? [];
          if (rows.length) {
            await model.insertMany(mapDocuments(key, rows, ids), {
              session,
              ordered: true,
            });
          }
        }
      });
    } finally {
      await session.endSession();
    }
  } finally {
    if (acquired) {
      await lockCollection.deleteOne({ _id: lockId, owner });
    }
  }
}
