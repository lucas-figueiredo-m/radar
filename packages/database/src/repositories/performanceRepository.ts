import type Database from 'better-sqlite3';
import type {
  PerformanceMetricRow,
  InsertPerformanceMetric,
  PerformanceQueryFilter,
} from '../types';

export type PerformanceRepository = {
  insert: (metric: InsertPerformanceMetric) => PerformanceMetricRow;
  query: (filter: PerformanceQueryFilter) => PerformanceMetricRow[];
  count: (filter: PerformanceQueryFilter) => number;
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createPerformanceRepository = (db: Database.Database): PerformanceRepository => {
  const insertStmt = db.prepare<InsertPerformanceMetric>(
    `INSERT INTO performance_metrics (device_id, js_fps, ui_fps, js_heap, native_ram, cpu_usage, dropped_frames, gc_events, timestamp)
     VALUES (@device_id, @js_fps, @ui_fps, @js_heap, @native_ram, @cpu_usage, @dropped_frames, @gc_events, @timestamp)`,
  );

  const insert = (metric: InsertPerformanceMetric): PerformanceMetricRow => {
    const result = insertStmt.run(metric);
    return db
      .prepare<number, PerformanceMetricRow>('SELECT * FROM performance_metrics WHERE id = ?')
      .get(result.lastInsertRowid as number)!;
  };

  const query = (filter: PerformanceQueryFilter): PerformanceMetricRow[] => {
    const conditions: string[] = [];
    if (filter.device_id) conditions.push('device_id = @device_id');
    if (filter.from_timestamp !== undefined) conditions.push('timestamp >= @from_timestamp');
    if (filter.to_timestamp !== undefined) conditions.push('timestamp <= @to_timestamp');

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM performance_metrics
      ${where}
      ORDER BY timestamp ASC
      LIMIT @limit OFFSET @offset`;

    return db
      .prepare<PerformanceQueryFilter, PerformanceMetricRow>(sql)
      .all({ ...filter, limit: filter.limit ?? 1000, offset: filter.offset ?? 0 });
  };

  const count = (filter: PerformanceQueryFilter): number => {
    const conditions: string[] = [];
    if (filter.device_id) conditions.push('device_id = @device_id');
    if (filter.from_timestamp !== undefined) conditions.push('timestamp >= @from_timestamp');
    if (filter.to_timestamp !== undefined) conditions.push('timestamp <= @to_timestamp');

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM performance_metrics ${where}`;

    const row = db
      .prepare<PerformanceQueryFilter, { count: number }>(sql)
      .get(filter);

    return row?.count ?? 0;
  };

  const clear = (deviceId: string): number => {
    const result = db
      .prepare<string>('DELETE FROM performance_metrics WHERE device_id = ?')
      .run(deviceId);
    return result.changes;
  };

  const clearAll = (): number => {
    const result = db.prepare('DELETE FROM performance_metrics').run();
    return result.changes;
  };

  return { insert, query, count, clear, clearAll };
};
