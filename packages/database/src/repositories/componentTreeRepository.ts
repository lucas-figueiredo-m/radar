import type Database from 'better-sqlite3';
import type {
  ComponentTreeRow,
  InsertComponentTree,
  QueryFilter,
} from '../types';

export type ComponentTreeRepository = {
  insert: (tree: InsertComponentTree) => ComponentTreeRow;
  getLatest: (deviceId?: string) => ComponentTreeRow | null;
  query: (filter: QueryFilter) => ComponentTreeRow[];
  count: (filter: QueryFilter) => number;
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createComponentTreeRepository = (db: Database.Database): ComponentTreeRepository => {
  const insertStmt = db.prepare<InsertComponentTree>(
    `INSERT INTO component_trees (device_id, root_nodes, timestamp)
     VALUES (@device_id, @root_nodes, @timestamp)`,
  );

  const insert = (tree: InsertComponentTree): ComponentTreeRow => {
    const result = insertStmt.run(tree);
    return db
      .prepare<number, ComponentTreeRow>('SELECT * FROM component_trees WHERE id = ?')
      .get(result.lastInsertRowid as number)!;
  };

  const getLatest = (deviceId?: string): ComponentTreeRow | null => {
    if (deviceId) {
      return db
        .prepare<string, ComponentTreeRow>(
          'SELECT * FROM component_trees WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1',
        )
        .get(deviceId) ?? null;
    }
    return db
      .prepare<[], ComponentTreeRow>(
        'SELECT * FROM component_trees ORDER BY timestamp DESC LIMIT 1',
      )
      .get() ?? null;
  };

  const query = (filter: QueryFilter): ComponentTreeRow[] => {
    const conditions: string[] = [];
    if (filter.device_id) conditions.push('device_id = @device_id');

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM component_trees
      ${where}
      ORDER BY timestamp ASC
      LIMIT @limit OFFSET @offset`;

    return db
      .prepare<QueryFilter, ComponentTreeRow>(sql)
      .all({ ...filter, limit: filter.limit ?? 1000, offset: filter.offset ?? 0 });
  };

  const count = (filter: QueryFilter): number => {
    if (filter.device_id) {
      const row = db
        .prepare<string, { count: number }>(
          'SELECT COUNT(*) as count FROM component_trees WHERE device_id = ?',
        )
        .get(filter.device_id);
      return row?.count ?? 0;
    }
    const row = db
      .prepare<[], { count: number }>(
        'SELECT COUNT(*) as count FROM component_trees',
      )
      .get();
    return row?.count ?? 0;
  };

  const clear = (deviceId: string): number => {
    const result = db
      .prepare<string>('DELETE FROM component_trees WHERE device_id = ?')
      .run(deviceId);
    return result.changes;
  };

  const clearAll = (): number => {
    const result = db.prepare('DELETE FROM component_trees').run();
    return result.changes;
  };

  return { insert, getLatest, query, count, clear, clearAll };
};
