import type Database from 'better-sqlite3';
import type {
  InspectedComponentRow,
  InsertInspectedComponent,
  QueryFilter,
} from '../types';

export type InspectedComponentRepository = {
  upsert: (component: InsertInspectedComponent) => InspectedComponentRow;
  getByComponentId: (
    deviceId: string,
    componentId: string,
  ) => InspectedComponentRow | null;
  query: (filter: QueryFilter) => InspectedComponentRow[];
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createInspectedComponentRepository = (
  db: Database.Database,
): InspectedComponentRepository => {
  const upsertStmt = db.prepare<InsertInspectedComponent>(
    `INSERT INTO inspected_components (device_id, component_id, data, timestamp)
     VALUES (@device_id, @component_id, @data, @timestamp)
     ON CONFLICT(device_id, component_id) DO UPDATE SET
       data = @data,
       timestamp = @timestamp`,
  );

  const upsert = (
    component: InsertInspectedComponent,
  ): InspectedComponentRow => {
    upsertStmt.run(component);
    return db
      .prepare<[string, string], InspectedComponentRow>(
        'SELECT * FROM inspected_components WHERE device_id = ? AND component_id = ?',
      )
      .get(component.device_id, component.component_id)!;
  };

  const getByComponentId = (
    deviceId: string,
    componentId: string,
  ): InspectedComponentRow | null => {
    return (
      db
        .prepare<[string, string], InspectedComponentRow>(
          'SELECT * FROM inspected_components WHERE device_id = ? AND component_id = ?',
        )
        .get(deviceId, componentId) ?? null
    );
  };

  const query = (filter: QueryFilter): InspectedComponentRow[] => {
    const sql = `SELECT * FROM inspected_components
      WHERE device_id = @device_id
      ORDER BY timestamp DESC
      LIMIT @limit OFFSET @offset`;

    return db.prepare<QueryFilter, InspectedComponentRow>(sql).all({
      ...filter,
      limit: filter.limit ?? 1000,
      offset: filter.offset ?? 0,
    });
  };

  const clear = (deviceId: string): number => {
    const result = db
      .prepare<string>('DELETE FROM inspected_components WHERE device_id = ?')
      .run(deviceId);
    return result.changes;
  };

  const clearAll = (): number => {
    const result = db.prepare('DELETE FROM inspected_components').run();
    return result.changes;
  };

  return { upsert, getByComponentId, query, clear, clearAll };
};
