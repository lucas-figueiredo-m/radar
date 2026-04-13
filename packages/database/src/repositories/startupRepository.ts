import type Database from 'better-sqlite3';
import type { StartupMetricRow, InsertStartupMetric } from '../types';

export type StartupRepository = {
  upsert: (metric: InsertStartupMetric) => StartupMetricRow;
  get: (deviceId: string) => StartupMetricRow | null;
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createStartupRepository = (
  db: Database.Database,
): StartupRepository => {
  const upsertStmt = db.prepare<InsertStartupMetric>(
    `INSERT INTO startup_metrics (device_id, js_bundle_eval, native_launch, tti, timestamp)
     VALUES (@device_id, @js_bundle_eval, @native_launch, @tti, @timestamp)
     ON CONFLICT(device_id) DO UPDATE SET
       js_bundle_eval = @js_bundle_eval,
       native_launch = @native_launch,
       tti = @tti,
       timestamp = @timestamp`,
  );

  const upsert = (metric: InsertStartupMetric): StartupMetricRow => {
    upsertStmt.run(metric);
    return db
      .prepare<string, StartupMetricRow>(
        'SELECT * FROM startup_metrics WHERE device_id = ?',
      )
      .get(metric.device_id)!;
  };

  const get = (deviceId: string): StartupMetricRow | null => {
    return (
      db
        .prepare<string, StartupMetricRow>(
          'SELECT * FROM startup_metrics WHERE device_id = ?',
        )
        .get(deviceId) ?? null
    );
  };

  const clear = (deviceId: string): number => {
    const result = db
      .prepare<string>('DELETE FROM startup_metrics WHERE device_id = ?')
      .run(deviceId);
    return result.changes;
  };

  const clearAll = (): number => {
    const result = db.prepare('DELETE FROM startup_metrics').run();
    return result.changes;
  };

  return { upsert, get, clear, clearAll };
};
