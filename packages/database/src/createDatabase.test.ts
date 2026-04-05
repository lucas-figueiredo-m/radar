import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase } from './createDatabase';
import type { RadarDatabase } from './createDatabase';

describe('createDatabase', () => {
  let db: RadarDatabase;

  beforeEach(() => {
    db = createDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('creates an in-memory database', () => {
    expect(db).toBeDefined();
    expect(db.raw).toBeDefined();
  });

  describe('console repository', () => {
    it('inserts and queries console logs', () => {
      db.console.insert({
        device_id: 'device-1',
        level: 'log',
        args: '["hello world"]',
        timestamp: 1000,
      });

      db.console.insert({
        device_id: 'device-1',
        level: 'error',
        args: '["something failed"]',
        timestamp: 2000,
      });

      const logs = db.console.query({ device_id: 'device-1' });
      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe('log');
      expect(logs[1].level).toBe('error');
    });

    it('filters by level', () => {
      db.console.insert({ device_id: 'device-1', level: 'log', args: '["a"]', timestamp: 1000 });
      db.console.insert({ device_id: 'device-1', level: 'error', args: '["b"]', timestamp: 2000 });

      const errors = db.console.query({ device_id: 'device-1', level: 'error' });
      expect(errors).toHaveLength(1);
      expect(errors[0].args).toBe('["b"]');
    });

    it('filters by device_id', () => {
      db.console.insert({ device_id: 'device-1', level: 'log', args: '["a"]', timestamp: 1000 });
      db.console.insert({ device_id: 'device-2', level: 'log', args: '["b"]', timestamp: 2000 });

      const logs = db.console.query({ device_id: 'device-1' });
      expect(logs).toHaveLength(1);
    });

    it('counts logs', () => {
      db.console.insert({ device_id: 'device-1', level: 'log', args: '["a"]', timestamp: 1000 });
      db.console.insert({ device_id: 'device-1', level: 'log', args: '["b"]', timestamp: 2000 });

      expect(db.console.count({ device_id: 'device-1' })).toBe(2);
      expect(db.console.count({ device_id: 'device-1', level: 'error' })).toBe(0);
    });

    it('clears logs by device', () => {
      db.console.insert({ device_id: 'device-1', level: 'log', args: '["a"]', timestamp: 1000 });
      db.console.insert({ device_id: 'device-2', level: 'log', args: '["b"]', timestamp: 2000 });

      db.console.clear('device-1');
      expect(db.console.count({ device_id: 'device-1' })).toBe(0);
      expect(db.console.count({ device_id: 'device-2' })).toBe(1);
    });

    it('supports pagination', () => {
      for (let i = 0; i < 10; i++) {
        db.console.insert({ device_id: 'device-1', level: 'log', args: `["${i}"]`, timestamp: i * 1000 });
      }

      const page1 = db.console.query({ device_id: 'device-1', limit: 3, offset: 0 });
      const page2 = db.console.query({ device_id: 'device-1', limit: 3, offset: 3 });
      expect(page1).toHaveLength(3);
      expect(page2).toHaveLength(3);
      expect(page1[0].args).toBe('["0"]');
      expect(page2[0].args).toBe('["3"]');
    });
  });

  describe('network repository', () => {
    it('inserts request and updates with response', () => {
      db.network.insertRequest({
        id: 'req_0',
        device_id: 'device-1',
        method: 'GET',
        url: 'https://api.example.com/data',
        request_headers: '{"accept":"application/json"}',
        request_body: null,
        graphql_type: null,
        graphql_name: null,
        timestamp: 1000,
      });

      const pending = db.network.getById('req_0');
      expect(pending?.pending).toBe(1);
      expect(pending?.method).toBe('GET');

      db.network.updateResponse({
        id: 'req_0',
        status: 200,
        status_text: 'OK',
        response_headers: '{"content-type":"application/json"}',
        response_body: '{"data": []}',
        duration: 150.5,
        response_timestamp: 1150,
      });

      const completed = db.network.getById('req_0');
      expect(completed?.pending).toBe(0);
      expect(completed?.status).toBe(200);
      expect(completed?.duration).toBe(150.5);
    });

    it('handles GraphQL requests', () => {
      db.network.insertRequest({
        id: 'req_1',
        device_id: 'device-1',
        method: 'POST',
        url: 'https://api.example.com/graphql',
        request_headers: null,
        request_body: '{"query":"{ users { id } }"}',
        graphql_type: 'query',
        graphql_name: 'GetUsers',
        timestamp: 1000,
      });

      const gqlRequests = db.network.query({ device_id: 'device-1', graphql_type: 'query' });
      expect(gqlRequests).toHaveLength(1);
      expect(gqlRequests[0].graphql_name).toBe('GetUsers');
    });

    it('clears by device', () => {
      db.network.insertRequest({
        id: 'req_0', device_id: 'device-1', method: 'GET', url: '/a',
        request_headers: null, request_body: null, graphql_type: null, graphql_name: null, timestamp: 1000,
      });
      db.network.insertRequest({
        id: 'req_1', device_id: 'device-2', method: 'GET', url: '/b',
        request_headers: null, request_body: null, graphql_type: null, graphql_name: null, timestamp: 2000,
      });

      db.network.clear('device-1');
      expect(db.network.count({ device_id: 'device-1' })).toBe(0);
      expect(db.network.count({ device_id: 'device-2' })).toBe(1);
    });
  });

  describe('component tree repository', () => {
    it('inserts and retrieves latest tree', () => {
      db.componentTree.insert({
        device_id: 'device-1',
        root_nodes: '[{"id":"1","name":"App","key":null,"children":[]}]',
        timestamp: 1000,
      });

      db.componentTree.insert({
        device_id: 'device-1',
        root_nodes: '[{"id":"1","name":"App","key":null,"children":[{"id":"2","name":"View","key":null,"children":[]}]}]',
        timestamp: 2000,
      });

      const latest = db.componentTree.getLatest('device-1');
      expect(latest?.timestamp).toBe(2000);
      expect(JSON.parse(latest!.root_nodes)[0].children).toHaveLength(1);
    });
  });

  describe('profiler repository', () => {
    it('inserts session with commits', () => {
      const session = db.profiler.insertSession({
        device_id: 'device-1',
        timestamp: 5000,
      });

      db.profiler.insertCommit({
        profiler_session_id: session.id,
        device_id: 'device-1',
        commit_index: 0,
        timestamp: 5001,
        duration: 12.5,
        components: '[{"id":"1","name":"App"}]',
      });

      db.profiler.insertCommit({
        profiler_session_id: session.id,
        device_id: 'device-1',
        commit_index: 1,
        timestamp: 5050,
        duration: 8.3,
        components: '[{"id":"2","name":"View"}]',
      });

      const commits = db.profiler.getCommitsBySession(session.id);
      expect(commits).toHaveLength(2);
      expect(commits[0].commit_index).toBe(0);
      expect(commits[1].commit_index).toBe(1);
    });

    it('gets latest session', () => {
      db.profiler.insertSession({ device_id: 'device-1', timestamp: 1000 });
      db.profiler.insertSession({ device_id: 'device-1', timestamp: 2000 });

      const latest = db.profiler.getLatestSession('device-1');
      expect(latest?.timestamp).toBe(2000);
    });

    it('clears session and its commits', () => {
      const session = db.profiler.insertSession({ device_id: 'device-1', timestamp: 1000 });
      db.profiler.insertCommit({
        profiler_session_id: session.id,
        device_id: 'device-1',
        commit_index: 0,
        timestamp: 1001,
        duration: 5,
        components: '[]',
      });

      db.profiler.clearSession(session.id);
      expect(db.profiler.getCommitsBySession(session.id)).toHaveLength(0);
      expect(db.profiler.getLatestSession('device-1')).toBeNull();
    });
  });

  describe('performance repository', () => {
    it('inserts and queries metrics', () => {
      db.performance.insert({
        device_id: 'device-1',
        js_fps: 59.5,
        ui_fps: null,
        js_heap: 150000000,
        native_ram: null,
        cpu_usage: null,
        dropped_frames: 2,
        gc_events: 1,
        timestamp: 1000,
      });

      db.performance.insert({
        device_id: 'device-1',
        js_fps: 60,
        ui_fps: null,
        js_heap: 155000000,
        native_ram: null,
        cpu_usage: null,
        dropped_frames: 3,
        gc_events: 0,
        timestamp: 1500,
      });

      const metrics = db.performance.query({ device_id: 'device-1' });
      expect(metrics).toHaveLength(2);
      expect(metrics[0].js_fps).toBe(59.5);
    });

    it('filters by time range', () => {
      for (let i = 0; i < 5; i++) {
        db.performance.insert({
          device_id: 'device-1',
          js_fps: 60,
          ui_fps: null,
          js_heap: null,
          native_ram: null,
          cpu_usage: null,
          dropped_frames: 0,
          gc_events: 0,
          timestamp: i * 1000,
        });
      }

      const filtered = db.performance.query({
        device_id: 'device-1',
        from_timestamp: 1000,
        to_timestamp: 3000,
      });
      expect(filtered).toHaveLength(3);
    });
  });

  describe('inspected component repository', () => {
    it('upserts component data', () => {
      db.inspectedComponent.upsert({
        device_id: 'device-1',
        component_id: 'comp-1',
        data: '{"id":"comp-1","name":"Button","props":[],"hooks":[]}',
        timestamp: 1000,
      });

      const first = db.inspectedComponent.getByComponentId('device-1', 'comp-1');
      expect(first?.timestamp).toBe(1000);

      db.inspectedComponent.upsert({
        device_id: 'device-1',
        component_id: 'comp-1',
        data: '{"id":"comp-1","name":"Button","props":[{"key":"label","value":{"type":"string","value":"Click"}}],"hooks":[]}',
        timestamp: 2000,
      });

      const updated = db.inspectedComponent.getByComponentId('device-1', 'comp-1');
      expect(updated?.timestamp).toBe(2000);
      expect(JSON.parse(updated!.data).props).toHaveLength(1);
    });
  });

  describe('cross-device isolation', () => {
    it('isolates data between devices', () => {
      db.console.insert({ device_id: 'device-1', level: 'log', args: '["from 1"]', timestamp: 1000 });
      db.console.insert({ device_id: 'device-2', level: 'log', args: '["from 2"]', timestamp: 2000 });

      db.network.insertRequest({
        id: 'req_0', device_id: 'device-1', method: 'GET', url: '/a',
        request_headers: null, request_body: null, graphql_type: null, graphql_name: null, timestamp: 1000,
      });
      db.network.insertRequest({
        id: 'req_1', device_id: 'device-2', method: 'POST', url: '/b',
        request_headers: null, request_body: null, graphql_type: null, graphql_name: null, timestamp: 2000,
      });

      expect(db.console.query({ device_id: 'device-1' })).toHaveLength(1);
      expect(db.console.query({ device_id: 'device-2' })).toHaveLength(1);
      expect(db.network.query({ device_id: 'device-1' })).toHaveLength(1);
      expect(db.network.query({ device_id: 'device-2' })).toHaveLength(1);

      db.console.clear('device-1');
      expect(db.console.query({ device_id: 'device-1' })).toHaveLength(0);
      expect(db.console.query({ device_id: 'device-2' })).toHaveLength(1);
    });
  });

  describe('session_id defaults', () => {
    it('defaults session_id to 1 on all session-aware tables', () => {
      const tree = db.componentTree.insert({
        device_id: 'device-1',
        root_nodes: '[]',
        timestamp: 1000,
      });
      expect(tree.session_id).toBe(1);

      const session = db.profiler.insertSession({ device_id: 'device-1', timestamp: 1000 });
      expect(session.session_id).toBe(1);

      const metric = db.performance.insert({
        device_id: 'device-1',
        js_fps: 60,
        ui_fps: null,
        js_heap: null,
        native_ram: null,
        cpu_usage: null,
        dropped_frames: 0,
        gc_events: 0,
        timestamp: 1000,
      });
      expect(metric.session_id).toBe(1);
    });
  });
});
