import { createDatabase } from '@radar/database';
import type { RadarDatabase } from '@radar/database';

let db: RadarDatabase | null = null;

export const getDatabase = (): RadarDatabase => {
  if (!db) {
    db = createDatabase();
    console.log('[radar] In-memory database initialized');
  }
  return db;
};

export const closeDatabase = (): void => {
  db?.close();
  db = null;
};
