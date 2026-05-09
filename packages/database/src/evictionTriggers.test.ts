import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase } from './createDatabase';
import type { RadarDatabase } from './createDatabase';

describe('eviction triggers', () => {
  let db: RadarDatabase;

  beforeEach(() => {
    db = createDatabase();
  });

  afterEach(() => {
    db.close();
  });

  describe('console_logs', () => {
    it('keeps row count at the cap after exceeding the threshold', () => {
      const insertMany = db.raw.transaction((count: number) => {
        for (let i = 0; i < count; i++) {
          db.console.insert({
            device_id: 'device-1',
            level: 'log',
            args: `["${i}"]`,
            timestamp: i,
          });
        }
      });

      insertMany(10001);

      const remaining = db.console.count({ device_id: 'device-1' });
      expect(remaining).toBe(9001);
    });

    it('drops the oldest rows by id', () => {
      const insertMany = db.raw.transaction((count: number) => {
        for (let i = 0; i < count; i++) {
          db.console.insert({
            device_id: 'device-1',
            level: 'log',
            args: `["${i}"]`,
            timestamp: i,
          });
        }
      });

      insertMany(10001);

      const oldest = db.console.query({
        device_id: 'device-1',
        limit: 1,
        offset: 0,
      });
      expect(JSON.parse(oldest[0].args)[0]).toBe('1000');
    });

    it('only trims rows for the inserting device', () => {
      const insertForDevice = db.raw.transaction(
        (deviceId: string, count: number) => {
          for (let i = 0; i < count; i++) {
            db.console.insert({
              device_id: deviceId,
              level: 'log',
              args: `["${i}"]`,
              timestamp: i,
            });
          }
        },
      );

      insertForDevice('device-1', 100);
      insertForDevice('device-2', 10001);

      expect(db.console.count({ device_id: 'device-1' })).toBe(100);
      expect(db.console.count({ device_id: 'device-2' })).toBe(9001);
    });
  });

  describe('network_requests', () => {
    it('caps row count per device', () => {
      const insertMany = db.raw.transaction((count: number) => {
        for (let i = 0; i < count; i++) {
          db.network.insertRequest({
            id: `req_${i}`,
            device_id: 'device-1',
            method: 'GET',
            url: `/api/${i}`,
            request_headers: null,
            request_body: null,
            graphql_type: null,
            graphql_name: null,
            timestamp: i,
          });
        }
      });

      insertMany(10001);

      expect(db.network.count({ device_id: 'device-1' })).toBe(9001);
    });
  });

  describe('profiler_commits', () => {
    it('caps commit rows per device at 5000', () => {
      const session = db.profiler.insertSession({
        device_id: 'device-1',
        timestamp: 0,
      });

      const insertMany = db.raw.transaction((count: number) => {
        for (let i = 0; i < count; i++) {
          db.profiler.insertCommit({
            profiler_session_id: session.id,
            device_id: 'device-1',
            commit_index: i,
            timestamp: i,
            duration: 1,
            components: '[]',
          });
        }
      });

      insertMany(5001);

      const commits = db.raw
        .prepare<string, { count: number }>(
          'SELECT count(*) as count FROM profiler_commits WHERE device_id = ?',
        )
        .get('device-1');
      expect(commits?.count).toBe(4501);
    });
  });

  describe('performance_metrics', () => {
    it('caps row count per device', () => {
      const insertMany = db.raw.transaction((count: number) => {
        for (let i = 0; i < count; i++) {
          db.performance.insert({
            device_id: 'device-1',
            js_fps: 60,
            ui_fps: null,
            js_heap: null,
            native_ram: null,
            cpu_usage: null,
            dropped_frames: 0,
            gc_events: 0,
            timestamp: i,
          });
        }
      });

      insertMany(10001);

      const count = db.raw
        .prepare<string, { count: number }>(
          'SELECT count(*) as count FROM performance_metrics WHERE device_id = ?',
        )
        .get('device-1');
      expect(count?.count).toBe(9001);
    });
  });

  describe('state_actions', () => {
    it('caps action rows per device', () => {
      const insertMany = db.raw.transaction((count: number) => {
        for (let i = 0; i < count; i++) {
          db.state.insertAction({
            device_id: 'device-1',
            store_name: 'cart',
            action_type: 'ADD_ITEM',
            payload: '{}',
            state: '{}',
            timestamp: i,
          });
        }
      });

      insertMany(10001);

      const count = db.raw
        .prepare<string, { count: number }>(
          'SELECT count(*) as count FROM state_actions WHERE device_id = ?',
        )
        .get('device-1');
      expect(count?.count).toBe(9001);
    });
  });

  describe('below threshold', () => {
    it('does not evict when count stays at or below cap', () => {
      const insertMany = db.raw.transaction((count: number) => {
        for (let i = 0; i < count; i++) {
          db.console.insert({
            device_id: 'device-1',
            level: 'log',
            args: `["${i}"]`,
            timestamp: i,
          });
        }
      });

      insertMany(10000);

      expect(db.console.count({ device_id: 'device-1' })).toBe(10000);
    });
  });
});
