import mongoose, { type Model } from 'mongoose';

// These helpers deliberately operate on every registered Mongoose model.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedModel = Model<any>;

export function toRecord<T>(value: unknown): T {
  if (value instanceof mongoose.Types.ObjectId) return value.toString() as T;
  if (value instanceof Date || value === null || typeof value !== 'object') return value as T;
  if (Array.isArray(value)) return value.map((item) => toRecord(item)) as T;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(source)) {
    if (key === '__v') continue;
    result[key] = toRecord(item);
  }
  return result as T;
}

export function validId(value: string): boolean {
  return /^[\da-f]{24}$/i.test(value);
}

export async function findRecord<T>(
  model: UntypedModel,
  id: string
): Promise<T | null> {
  if (!validId(id)) return null;
  const document = await model.findById(id).lean().exec();
  return document ? toRecord<T>(document) : null;
}

export async function findRecords<T>(
  model: UntypedModel,
  filter: Record<string, unknown> = {},
  sort?: Record<string, 1 | -1>
): Promise<T[]> {
  let query = model.find(filter).lean();
  if (sort) query = query.sort(sort);
  const documents = await query.exec();
  return documents.map((document) => toRecord<T>(document));
}

export async function insertRecord<T>(
  model: UntypedModel,
  data: Record<string, unknown>
): Promise<T> {
  const document = await model.create(data);
  return toRecord<T>(document.toObject());
}

export async function updateRecord<T>(
  model: UntypedModel,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  if (!validId(id)) return null;
  const document = await model
    .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    .lean()
    .exec();
  return document ? toRecord<T>(document) : null;
}
