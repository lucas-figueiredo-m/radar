import type Database from 'better-sqlite3';
import type {
  StorageCapabilityRow,
  InsertStorageCapability,
  StorageEntryRow,
  InsertStorageEntry,
  StorageEntryFilter,
} from '../types';

export type StorageRepository = {
  upsertCapability: (cap: InsertStorageCapability) => StorageCapabilityRow;
  getCapabilities: (deviceId?: string) => StorageCapabilityRow[];
  replaceEntries: (
    deviceId: string,
    backend: 'asyncStorage' | 'mmkv',
    instanceId: string | null,
    entries: InsertStorageEntry[],
  ) => void;
  getEntries: (filter: StorageEntryFilter) => StorageEntryRow[];
  removeEntry: (
    deviceId: string,
    backend: 'asyncStorage' | 'mmkv',
    key: string,
    instanceId?: string,
  ) => number;
  clearEntries: (
    deviceId: string,
    backend: 'asyncStorage' | 'mmkv',
    instanceId?: string,
  ) => number;
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createStorageRepository = (
  db: Database.Database,
): StorageRepository => {
  const upsertCapStmt = db.prepare<InsertStorageCapability>(
    `INSERT INTO storage_capabilities (device_id, backend, available, instance_id)
     VALUES (@device_id, @backend, @available, @instance_id)
     ON CONFLICT(device_id, backend, COALESCE(instance_id, '')) DO UPDATE SET
       available = @available`,
  );

  const upsertCapability = (
    cap: InsertStorageCapability,
  ): StorageCapabilityRow => {
    upsertCapStmt.run(cap);
    return db
      .prepare<[string, string, string], StorageCapabilityRow>(
        `SELECT * FROM storage_capabilities
         WHERE device_id = ? AND backend = ? AND COALESCE(instance_id, '') = ?`,
      )
      .get(cap.device_id, cap.backend, cap.instance_id ?? '')!;
  };

  const getCapabilities = (deviceId?: string): StorageCapabilityRow[] => {
    if (deviceId) {
      return db
        .prepare<string, StorageCapabilityRow>(
          'SELECT * FROM storage_capabilities WHERE device_id = ? ORDER BY backend, instance_id',
        )
        .all(deviceId);
    }
    return db
      .prepare<[], StorageCapabilityRow>(
        'SELECT * FROM storage_capabilities ORDER BY device_id, backend, instance_id',
      )
      .all();
  };

  const insertEntryStmt = db.prepare<InsertStorageEntry>(
    `INSERT INTO storage_entries (device_id, backend, instance_id, key, value, value_type, timestamp)
     VALUES (@device_id, @backend, @instance_id, @key, @value, @value_type, @timestamp)
     ON CONFLICT(device_id, backend, COALESCE(instance_id, ''), key) DO UPDATE SET
       value = @value,
       value_type = @value_type,
       timestamp = @timestamp`,
  );

  const replaceEntries = (
    deviceId: string,
    backend: 'asyncStorage' | 'mmkv',
    instanceId: string | null,
    entries: InsertStorageEntry[],
  ): void => {
    const transaction = db.transaction(() => {
      db.prepare<[string, string, string]>(
        `DELETE FROM storage_entries
         WHERE device_id = ? AND backend = ? AND COALESCE(instance_id, '') = ?`,
      ).run(deviceId, backend, instanceId ?? '');

      for (const entry of entries) {
        insertEntryStmt.run(entry);
      }
    });
    transaction();
  };

  const getEntries = (filter: StorageEntryFilter): StorageEntryRow[] => {
    const conditions = ['backend = @backend'];
    if (filter.device_id) conditions.push('device_id = @device_id');
    if (filter.instance_id) {
      conditions.push('instance_id = @instance_id');
    } else {
      conditions.push("(instance_id IS NULL OR instance_id = '')");
    }

    const sql = `SELECT * FROM storage_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY key ASC`;

    return db
      .prepare<StorageEntryFilter, StorageEntryRow>(sql)
      .all(filter);
  };

  const removeEntry = (
    deviceId: string,
    backend: 'asyncStorage' | 'mmkv',
    key: string,
    instanceId?: string,
  ): number => {
    const result = db
      .prepare<[string, string, string, string]>(
        `DELETE FROM storage_entries
         WHERE device_id = ? AND backend = ? AND key = ? AND COALESCE(instance_id, '') = ?`,
      )
      .run(deviceId, backend, key, instanceId ?? '');
    return result.changes;
  };

  const clearEntries = (
    deviceId: string,
    backend: 'asyncStorage' | 'mmkv',
    instanceId?: string,
  ): number => {
    const result = db
      .prepare<[string, string, string]>(
        `DELETE FROM storage_entries
         WHERE device_id = ? AND backend = ? AND COALESCE(instance_id, '') = ?`,
      )
      .run(deviceId, backend, instanceId ?? '');
    return result.changes;
  };

  const clear = (deviceId: string): number => {
    const r1 = db
      .prepare<string>('DELETE FROM storage_entries WHERE device_id = ?')
      .run(deviceId);
    const r2 = db
      .prepare<string>('DELETE FROM storage_capabilities WHERE device_id = ?')
      .run(deviceId);
    return r1.changes + r2.changes;
  };

  const clearAll = (): number => {
    const r1 = db.prepare('DELETE FROM storage_entries').run();
    const r2 = db.prepare('DELETE FROM storage_capabilities').run();
    return r1.changes + r2.changes;
  };

  return {
    upsertCapability,
    getCapabilities,
    replaceEntries,
    getEntries,
    removeEntry,
    clearEntries,
    clear,
    clearAll,
  };
};
