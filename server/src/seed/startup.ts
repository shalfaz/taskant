import { connectMongo } from '../db/mongo';
import { importLegacyStoreIfMongoEmpty } from '../db/legacyImport';

export async function seedOnStartup(): Promise<void> {
  await connectMongo();
  await importLegacyStoreIfMongoEmpty();
}
