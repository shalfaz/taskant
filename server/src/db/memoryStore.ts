import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type {
  IUser,
  ITask,
  IBid,
  IMessage,
  INotification,
  IPayment,
  IReview,
  IVerification,
  IReport,
} from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

interface Store {
  users: IUser[];
  tasks: ITask[];
  bids: IBid[];
  messages: IMessage[];
  notifications: INotification[];
  payments: IPayment[];
  reviews: IReview[];
  verifications: IVerification[];
  reports: IReport[];
}

const emptyStore = (): Store => ({
  users: [],
  tasks: [],
  bids: [],
  messages: [],
  notifications: [],
  payments: [],
  reviews: [],
  verifications: [],
  reports: [],
});

let store: Store = emptyStore();
let useMemory = true;

export function isUsingMemoryStore(): boolean {
  return useMemory;
}

export function loadStore(): Store {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      store = JSON.parse(raw) as Store;
    }
  } catch {
    store = emptyStore();
  }
  return store;
}

export function saveStore(): void {
  if (!useMemory) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

export function initMemoryStore(): void {
  useMemory = true;
  loadStore();
}

export function setUseMongo(): void {
  useMemory = false;
}

export function generateId(): string {
  return uuidv4();
}

export const memoryDb = {
  users: {
    find: (query?: Partial<IUser>) => {
      if (!query) return [...store.users];
      return store.users.filter((u) =>
        Object.entries(query).every(([k, v]) => (u as Record<string, unknown>)[k] === v)
      );
    },
    findById: (id: string) => store.users.find((u) => u._id === id) || null,
    findOne: (query: Partial<IUser>) =>
      store.users.find((u) =>
        Object.entries(query).every(([k, v]) => (u as Record<string, unknown>)[k] === v)
      ) || null,
    create: (data: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>) => {
      const user: IUser = {
        ...data,
        _id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.users.push(user);
      saveStore();
      return user;
    },
    update: (id: string, data: Partial<IUser>) => {
      const idx = store.users.findIndex((u) => u._id === id);
      if (idx === -1) return null;
      store.users[idx] = { ...store.users[idx], ...data, updatedAt: new Date() };
      saveStore();
      return store.users[idx];
    },
    count: () => store.users.length,
  },
  tasks: {
    find: (filter?: (t: ITask) => boolean) => (filter ? store.tasks.filter(filter) : [...store.tasks]),
    findById: (id: string) => store.tasks.find((t) => t._id === id) || null,
    create: (data: Omit<ITask, '_id' | 'createdAt' | 'updatedAt'>) => {
      const task: ITask = {
        ...data,
        _id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.tasks.push(task);
      saveStore();
      return task;
    },
    update: (id: string, data: Partial<ITask>) => {
      const idx = store.tasks.findIndex((t) => t._id === id);
      if (idx === -1) return null;
      store.tasks[idx] = { ...store.tasks[idx], ...data, updatedAt: new Date() };
      saveStore();
      return store.tasks[idx];
    },
    count: () => store.tasks.length,
  },
  bids: {
    find: (filter?: (b: IBid) => boolean) => (filter ? store.bids.filter(filter) : [...store.bids]),
    findById: (id: string) => store.bids.find((b) => b._id === id) || null,
    create: (data: Omit<IBid, '_id' | 'createdAt'>) => {
      const bid: IBid = { ...data, _id: generateId(), createdAt: new Date() };
      store.bids.push(bid);
      saveStore();
      return bid;
    },
    update: (id: string, data: Partial<IBid>) => {
      const idx = store.bids.findIndex((b) => b._id === id);
      if (idx === -1) return null;
      store.bids[idx] = { ...store.bids[idx], ...data };
      saveStore();
      return store.bids[idx];
    },
  },
  messages: {
    find: (filter?: (m: IMessage) => boolean) =>
      filter ? store.messages.filter(filter) : [...store.messages],
    create: (data: Omit<IMessage, '_id' | 'createdAt'>) => {
      const msg: IMessage = { ...data, _id: generateId(), createdAt: new Date() };
      store.messages.push(msg);
      saveStore();
      return msg;
    },
    updateMany: (filter: (m: IMessage) => boolean, data: Partial<IMessage>) => {
      store.messages.forEach((m, i) => {
        if (filter(m)) store.messages[i] = { ...m, ...data };
      });
      saveStore();
    },
  },
  notifications: {
    find: (filter?: (n: INotification) => boolean) =>
      filter ? store.notifications.filter(filter) : [...store.notifications],
    create: (data: Omit<INotification, '_id' | 'createdAt'>) => {
      const n: INotification = { ...data, _id: generateId(), createdAt: new Date() };
      store.notifications.push(n);
      saveStore();
      return n;
    },
    update: (id: string, data: Partial<INotification>) => {
      const idx = store.notifications.findIndex((n) => n._id === id);
      if (idx === -1) return null;
      store.notifications[idx] = { ...store.notifications[idx], ...data };
      saveStore();
      return store.notifications[idx];
    },
  },
  payments: {
    find: (filter?: (p: IPayment) => boolean) =>
      filter ? store.payments.filter(filter) : [...store.payments],
    findOne: (filter: (p: IPayment) => boolean) => store.payments.find(filter) || null,
    create: (data: Omit<IPayment, '_id' | 'createdAt'>) => {
      const p: IPayment = { ...data, _id: generateId(), createdAt: new Date() };
      store.payments.push(p);
      saveStore();
      return p;
    },
    update: (id: string, data: Partial<IPayment>) => {
      const idx = store.payments.findIndex((p) => p._id === id);
      if (idx === -1) return null;
      store.payments[idx] = { ...store.payments[idx], ...data };
      saveStore();
      return store.payments[idx];
    },
  },
  reviews: {
    find: (filter?: (r: IReview) => boolean) =>
      filter ? store.reviews.filter(filter) : [...store.reviews],
    findOne: (filter: (r: IReview) => boolean) => store.reviews.find(filter) || null,
    create: (data: Omit<IReview, '_id' | 'createdAt'>) => {
      const r: IReview = { ...data, _id: generateId(), createdAt: new Date() };
      store.reviews.push(r);
      saveStore();
      return r;
    },
  },
  verifications: {
    find: (filter?: (v: IVerification) => boolean) =>
      filter ? store.verifications.filter(filter) : [...store.verifications],
    findOne: (filter: (v: IVerification) => boolean) => store.verifications.find(filter) || null,
    create: (data: Omit<IVerification, '_id' | 'createdAt' | 'updatedAt'>) => {
      const v: IVerification = {
        ...data,
        _id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.verifications.push(v);
      saveStore();
      return v;
    },
    update: (id: string, data: Partial<IVerification>) => {
      const idx = store.verifications.findIndex((v) => v._id === id);
      if (idx === -1) return null;
      store.verifications[idx] = {
        ...store.verifications[idx],
        ...data,
        updatedAt: new Date(),
      };
      saveStore();
      return store.verifications[idx];
    },
  },
  reports: {
    find: (filter?: (r: IReport) => boolean) =>
      filter ? store.reports.filter(filter) : [...store.reports],
    create: (data: Omit<IReport, '_id' | 'createdAt' | 'updatedAt'>) => {
      const r: IReport = {
        ...data,
        _id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.reports.push(r);
      saveStore();
      return r;
    },
    update: (id: string, data: Partial<IReport>) => {
      const idx = store.reports.findIndex((r) => r._id === id);
      if (idx === -1) return null;
      store.reports[idx] = { ...store.reports[idx], ...data, updatedAt: new Date() };
      saveStore();
      return store.reports[idx];
    },
  },
  reset: (newStore: Store) => {
    store = newStore;
    saveStore();
  },
  getStore: () => store,
};
