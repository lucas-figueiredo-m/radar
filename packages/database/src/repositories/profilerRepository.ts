import type Database from 'better-sqlite3';
import type {
  ProfilerSessionRow,
  ProfilerCommitRow,
  InsertProfilerSession,
  InsertProfilerCommit,
  QueryFilter,
} from '../types';

export type ProfilerRepository = {
  insertSession: (session: InsertProfilerSession) => ProfilerSessionRow;
  insertCommit: (commit: InsertProfilerCommit) => ProfilerCommitRow;
  insertSessionWithCommits: (
    session: InsertProfilerSession,
    commits: Omit<InsertProfilerCommit, 'profiler_session_id'>[],
  ) => { session: ProfilerSessionRow; commits: ProfilerCommitRow[] };
  getSessions: (filter: QueryFilter) => ProfilerSessionRow[];
  getCommitsBySession: (profilerSessionId: number) => ProfilerCommitRow[];
  getLatestSession: (deviceId?: string) => ProfilerSessionRow | null;
  clearSession: (profilerSessionId: number) => number;
  clear: (deviceId: string) => number;
  clearAll: () => number;
};

export const createProfilerRepository = (db: Database.Database): ProfilerRepository => {
  const insertSessionStmt = db.prepare<InsertProfilerSession>(
    `INSERT INTO profiler_sessions (device_id, timestamp)
     VALUES (@device_id, @timestamp)`,
  );

  const insertCommitStmt = db.prepare<InsertProfilerCommit>(
    `INSERT INTO profiler_commits (profiler_session_id, device_id, commit_index, timestamp, duration, components)
     VALUES (@profiler_session_id, @device_id, @commit_index, @timestamp, @duration, @components)`,
  );

  const insertSession = (session: InsertProfilerSession): ProfilerSessionRow => {
    const result = insertSessionStmt.run(session);
    return db
      .prepare<number, ProfilerSessionRow>('SELECT * FROM profiler_sessions WHERE id = ?')
      .get(result.lastInsertRowid as number)!;
  };

  const insertCommit = (commit: InsertProfilerCommit): ProfilerCommitRow => {
    const result = insertCommitStmt.run(commit);
    return db
      .prepare<number, ProfilerCommitRow>('SELECT * FROM profiler_commits WHERE id = ?')
      .get(result.lastInsertRowid as number)!;
  };

  const insertSessionWithCommits = db.transaction(
    (session: InsertProfilerSession, commits: Omit<InsertProfilerCommit, 'profiler_session_id'>[]) => {
      const sessionRow = insertSession(session);
      const commitRows = commits.map(commit =>
        insertCommit({ ...commit, profiler_session_id: sessionRow.id }),
      );
      return { session: sessionRow, commits: commitRows };
    },
  );

  const getSessions = (filter: QueryFilter): ProfilerSessionRow[] => {
    const conditions: string[] = [];
    if (filter.device_id) conditions.push('device_id = @device_id');

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM profiler_sessions
      ${where}
      ORDER BY timestamp DESC
      LIMIT @limit OFFSET @offset`;

    return db
      .prepare<QueryFilter, ProfilerSessionRow>(sql)
      .all({ ...filter, limit: filter.limit ?? 100, offset: filter.offset ?? 0 });
  };

  const getCommitsBySession = (profilerSessionId: number): ProfilerCommitRow[] => {
    return db
      .prepare<number, ProfilerCommitRow>(
        'SELECT * FROM profiler_commits WHERE profiler_session_id = ? ORDER BY commit_index ASC',
      )
      .all(profilerSessionId);
  };

  const getLatestSession = (deviceId?: string): ProfilerSessionRow | null => {
    if (deviceId) {
      return db
        .prepare<string, ProfilerSessionRow>(
          'SELECT * FROM profiler_sessions WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1',
        )
        .get(deviceId) ?? null;
    }
    return db
      .prepare<[], ProfilerSessionRow>(
        'SELECT * FROM profiler_sessions ORDER BY timestamp DESC LIMIT 1',
      )
      .get() ?? null;
  };

  const clearSession = (profilerSessionId: number): number => {
    const commitResult = db
      .prepare<number>('DELETE FROM profiler_commits WHERE profiler_session_id = ?')
      .run(profilerSessionId);
    db.prepare<number>('DELETE FROM profiler_sessions WHERE id = ?').run(profilerSessionId);
    return commitResult.changes;
  };

  const clear = (deviceId: string): number => {
    db.prepare<string>('DELETE FROM profiler_commits WHERE device_id = ?').run(deviceId);
    const result = db
      .prepare<string>('DELETE FROM profiler_sessions WHERE device_id = ?')
      .run(deviceId);
    return result.changes;
  };

  const clearAll = (): number => {
    db.prepare('DELETE FROM profiler_commits').run();
    const result = db.prepare('DELETE FROM profiler_sessions').run();
    return result.changes;
  };

  return {
    insertSession,
    insertCommit,
    insertSessionWithCommits,
    getSessions,
    getCommitsBySession,
    getLatestSession,
    clearSession,
    clear,
    clearAll,
  };
};
