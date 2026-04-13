import type Database from 'better-sqlite3';
import type {
  StateCapabilityRow,
  InsertStateCapability,
  StateSnapshotRow,
  InsertStateSnapshot,
  StateActionRow,
  InsertStateAction,
} from '../types';

export type StateRepository = {
  upsertCapability: (cap: InsertStateCapability) => StateCapabilityRow;
  getCapabilities: (deviceId?: string) => StateCapabilityRow[];
  upsertSnapshot: (snapshot: InsertStateSnapshot) => StateSnapshotRow;
  getSnapshot: (deviceId: string, storeName: string) => StateSnapshotRow | null;
  getSnapshots: (deviceId?: string) => StateSnapshotRow[];
  insertAction: (action: InsertStateAction) => StateActionRow;
  getActions: (storeName: string, deviceId?: string) => StateActionRow[];
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createStateRepository = (
  db: Database.Database,
): StateRepository => {
  const upsertCapStmt = db.prepare<InsertStateCapability>(
    `INSERT INTO state_capabilities (device_id, store_name, store_type)
     VALUES (@device_id, @store_name, @store_type)
     ON CONFLICT(device_id, store_name) DO UPDATE SET
       store_type = @store_type`,
  );

  const upsertCapability = (
    cap: InsertStateCapability,
  ): StateCapabilityRow => {
    upsertCapStmt.run(cap);
    return db
      .prepare<[string, string], StateCapabilityRow>(
        'SELECT * FROM state_capabilities WHERE device_id = ? AND store_name = ?',
      )
      .get(cap.device_id, cap.store_name)!;
  };

  const getCapabilities = (deviceId?: string): StateCapabilityRow[] => {
    if (deviceId) {
      return db
        .prepare<string, StateCapabilityRow>(
          'SELECT * FROM state_capabilities WHERE device_id = ? ORDER BY store_name',
        )
        .all(deviceId);
    }
    return db
      .prepare<[], StateCapabilityRow>(
        'SELECT * FROM state_capabilities ORDER BY device_id, store_name',
      )
      .all();
  };

  const upsertSnapshotStmt = db.prepare<InsertStateSnapshot>(
    `INSERT INTO state_snapshots (device_id, store_name, state, timestamp)
     VALUES (@device_id, @store_name, @state, @timestamp)
     ON CONFLICT(device_id, store_name) DO UPDATE SET
       state = @state,
       timestamp = @timestamp`,
  );

  const upsertSnapshot = (
    snapshot: InsertStateSnapshot,
  ): StateSnapshotRow => {
    upsertSnapshotStmt.run(snapshot);
    return db
      .prepare<[string, string], StateSnapshotRow>(
        'SELECT * FROM state_snapshots WHERE device_id = ? AND store_name = ?',
      )
      .get(snapshot.device_id, snapshot.store_name)!;
  };

  const getSnapshot = (
    deviceId: string,
    storeName: string,
  ): StateSnapshotRow | null => {
    return (
      db
        .prepare<[string, string], StateSnapshotRow>(
          'SELECT * FROM state_snapshots WHERE device_id = ? AND store_name = ?',
        )
        .get(deviceId, storeName) ?? null
    );
  };

  const getSnapshots = (deviceId?: string): StateSnapshotRow[] => {
    if (deviceId) {
      return db
        .prepare<string, StateSnapshotRow>(
          'SELECT * FROM state_snapshots WHERE device_id = ? ORDER BY store_name',
        )
        .all(deviceId);
    }
    return db
      .prepare<[], StateSnapshotRow>(
        'SELECT * FROM state_snapshots ORDER BY device_id, store_name',
      )
      .all();
  };

  const insertActionStmt = db.prepare<InsertStateAction>(
    `INSERT INTO state_actions (device_id, store_name, action_type, payload, state, timestamp)
     VALUES (@device_id, @store_name, @action_type, @payload, @state, @timestamp)`,
  );

  const insertAction = (action: InsertStateAction): StateActionRow => {
    const result = insertActionStmt.run(action);
    return db
      .prepare<number, StateActionRow>(
        'SELECT * FROM state_actions WHERE id = ?',
      )
      .get(result.lastInsertRowid as number)!;
  };

  const getActions = (
    storeName: string,
    deviceId?: string,
  ): StateActionRow[] => {
    if (deviceId) {
      return db
        .prepare<[string, string], StateActionRow>(
          'SELECT * FROM state_actions WHERE device_id = ? AND store_name = ? ORDER BY timestamp ASC, id ASC',
        )
        .all(deviceId, storeName);
    }
    return db
      .prepare<string, StateActionRow>(
        'SELECT * FROM state_actions WHERE store_name = ? ORDER BY timestamp ASC, id ASC',
      )
      .all(storeName);
  };

  const clear = (deviceId: string): number => {
    const r1 = db
      .prepare<string>('DELETE FROM state_snapshots WHERE device_id = ?')
      .run(deviceId);
    const r2 = db
      .prepare<string>('DELETE FROM state_capabilities WHERE device_id = ?')
      .run(deviceId);
    const r3 = db
      .prepare<string>('DELETE FROM state_actions WHERE device_id = ?')
      .run(deviceId);
    return r1.changes + r2.changes + r3.changes;
  };

  const clearAll = (): number => {
    const r1 = db.prepare('DELETE FROM state_snapshots').run();
    const r2 = db.prepare('DELETE FROM state_capabilities').run();
    const r3 = db.prepare('DELETE FROM state_actions').run();
    return r1.changes + r2.changes + r3.changes;
  };

  return {
    upsertCapability,
    getCapabilities,
    upsertSnapshot,
    getSnapshot,
    getSnapshots,
    insertAction,
    getActions,
    clear,
    clearAll,
  };
};
