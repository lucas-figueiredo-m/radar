import type Database from 'better-sqlite3';
import type {
  ConsoleLogRow,
  InsertConsoleLog,
  ConsoleQueryFilter,
} from '../types';

export type ConsoleRepository = {
  insert: (log: InsertConsoleLog) => ConsoleLogRow;
  query: (filter: ConsoleQueryFilter) => ConsoleLogRow[];
  count: (filter: ConsoleQueryFilter) => number;
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createConsoleRepository = (db: Database.Database): ConsoleRepository => {
  const insertStmt = db.prepare<InsertConsoleLog>(
    `INSERT INTO console_logs (device_id, level, args, timestamp)
     VALUES (@device_id, @level, @args, @timestamp)`,
  );

  const insert = (log: InsertConsoleLog): ConsoleLogRow => {
    const result = insertStmt.run(log);
    return db
      .prepare<number, ConsoleLogRow>('SELECT * FROM console_logs WHERE id = ?')
      .get(result.lastInsertRowid as number)!;
  };

  const query = (filter: ConsoleQueryFilter): ConsoleLogRow[] => {
    const conditions: string[] = [];
    if (filter.device_id) conditions.push('device_id = @device_id');
    if (filter.level) conditions.push('level = @level');

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM console_logs
      ${where}
      ORDER BY timestamp ASC, id ASC
      LIMIT @limit OFFSET @offset`;

    return db
      .prepare<ConsoleQueryFilter, ConsoleLogRow>(sql)
      .all({ ...filter, limit: filter.limit ?? 5000, offset: filter.offset ?? 0 });
  };

  const count = (filter: ConsoleQueryFilter): number => {
    const conditions: string[] = [];
    if (filter.device_id) conditions.push('device_id = @device_id');
    if (filter.level) conditions.push('level = @level');

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM console_logs ${where}`;

    const row = db
      .prepare<ConsoleQueryFilter, { count: number }>(sql)
      .get(filter);

    return row?.count ?? 0;
  };

  const clear = (deviceId: string): number => {
    const result = db
      .prepare<string>('DELETE FROM console_logs WHERE device_id = ?')
      .run(deviceId);
    return result.changes;
  };

  const clearAll = (): number => {
    const result = db.prepare('DELETE FROM console_logs').run();
    return result.changes;
  };

  return { insert, query, count, clear, clearAll };
};
