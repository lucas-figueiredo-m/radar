import type Database from 'better-sqlite3';
import type {
  NetworkRequestRow,
  InsertNetworkRequest,
  UpdateNetworkResponse,
  NetworkQueryFilter,
} from '../types';

export type NetworkRepository = {
  insertRequest: (request: InsertNetworkRequest) => NetworkRequestRow;
  updateResponse: (response: UpdateNetworkResponse) => NetworkRequestRow | null;
  query: (filter: NetworkQueryFilter) => NetworkRequestRow[];
  getById: (id: string) => NetworkRequestRow | null;
  count: (filter: NetworkQueryFilter) => number;
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createNetworkRepository = (db: Database.Database): NetworkRepository => {
  const insertStmt = db.prepare<InsertNetworkRequest>(
    `INSERT INTO network_requests (id, device_id, method, url, request_headers, request_body, graphql_type, graphql_name, timestamp)
     VALUES (@id, @device_id, @method, @url, @request_headers, @request_body, @graphql_type, @graphql_name, @timestamp)`,
  );

  const updateStmt = db.prepare<UpdateNetworkResponse>(
    `UPDATE network_requests
     SET status = @status,
         status_text = @status_text,
         response_headers = @response_headers,
         response_body = @response_body,
         duration = @duration,
         response_timestamp = @response_timestamp,
         pending = 0,
         db_updated_at = (unixepoch('now','subsec') * 1000)
     WHERE id = @id`,
  );

  const getByIdStmt = db.prepare<string, NetworkRequestRow>(
    'SELECT * FROM network_requests WHERE id = ?',
  );

  const insertRequest = (request: InsertNetworkRequest): NetworkRequestRow => {
    insertStmt.run(request);
    return getByIdStmt.get(request.id)!;
  };

  const updateResponse = (response: UpdateNetworkResponse): NetworkRequestRow | null => {
    updateStmt.run(response);
    return getByIdStmt.get(response.id) ?? null;
  };

  const getById = (id: string): NetworkRequestRow | null => {
    return getByIdStmt.get(id) ?? null;
  };

  const query = (filter: NetworkQueryFilter): NetworkRequestRow[] => {
    const conditions = ['device_id = @device_id'];
    if (filter.method) conditions.push('method = @method');
    if (filter.status !== undefined) conditions.push('status = @status');
    if (filter.graphql_type) conditions.push('graphql_type = @graphql_type');
    if (filter.pending !== undefined) conditions.push('pending = @pending_val');

    const sql = `SELECT * FROM network_requests
      WHERE ${conditions.join(' AND ')}
      ORDER BY timestamp ASC, id ASC
      LIMIT @limit OFFSET @offset`;

    const params = {
      ...filter,
      pending_val: filter.pending ? 1 : 0,
      limit: filter.limit ?? 2000,
      offset: filter.offset ?? 0,
    };

    return db
      .prepare<typeof params, NetworkRequestRow>(sql)
      .all(params);
  };

  const count = (filter: NetworkQueryFilter): number => {
    const conditions = ['device_id = @device_id'];
    if (filter.method) conditions.push('method = @method');
    if (filter.status !== undefined) conditions.push('status = @status');
    if (filter.graphql_type) conditions.push('graphql_type = @graphql_type');
    if (filter.pending !== undefined) conditions.push('pending = @pending_val');

    const sql = `SELECT COUNT(*) as count FROM network_requests
      WHERE ${conditions.join(' AND ')}`;

    const params = {
      ...filter,
      pending_val: filter.pending ? 1 : 0,
    };

    const row = db
      .prepare<typeof params, { count: number }>(sql)
      .get(params);

    return row?.count ?? 0;
  };

  const clear = (deviceId: string): number => {
    const result = db
      .prepare<string>('DELETE FROM network_requests WHERE device_id = ?')
      .run(deviceId);
    return result.changes;
  };

  const clearAll = (): number => {
    const result = db.prepare('DELETE FROM network_requests').run();
    return result.changes;
  };

  return { insertRequest, updateResponse, query, getById, count, clear, clearAll };
};
