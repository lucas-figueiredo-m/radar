import type { LogLevel } from '@radar/types';

export type ConsoleLogRow = {
  id: number;
  device_id: string;
  level: LogLevel;
  args: string;
  timestamp: number;
  db_created_at: number;
};

export type InsertConsoleLog = {
  device_id: string;
  level: LogLevel;
  args: string;
  timestamp: number;
};

export type NetworkRequestRow = {
  id: string;
  device_id: string;
  method: string;
  url: string;
  request_headers: string | null;
  request_body: string | null;
  graphql_type: 'query' | 'mutation' | null;
  graphql_name: string | null;
  status: number | null;
  status_text: string | null;
  response_headers: string | null;
  response_body: string | null;
  duration: number | null;
  pending: number;
  timestamp: number;
  response_timestamp: number | null;
  db_created_at: number;
  db_updated_at: number;
};

export type InsertNetworkRequest = {
  id: string;
  device_id: string;
  method: string;
  url: string;
  request_headers: string | null;
  request_body: string | null;
  graphql_type: 'query' | 'mutation' | null;
  graphql_name: string | null;
  timestamp: number;
};

export type UpdateNetworkResponse = {
  id: string;
  status: number | null;
  status_text: string | null;
  response_headers: string | null;
  response_body: string | null;
  duration: number | null;
  response_timestamp: number | null;
};

export type ComponentTreeRow = {
  id: number;
  device_id: string;
  session_id: number;
  root_nodes: string;
  timestamp: number;
  db_created_at: number;
};

export type InsertComponentTree = {
  device_id: string;
  root_nodes: string;
  timestamp: number;
};

export type InspectedComponentRow = {
  id: number;
  device_id: string;
  session_id: number;
  component_id: string;
  data: string;
  timestamp: number;
  db_created_at: number;
};

export type InsertInspectedComponent = {
  device_id: string;
  component_id: string;
  data: string;
  timestamp: number;
};

export type ProfilerSessionRow = {
  id: number;
  device_id: string;
  session_id: number;
  timestamp: number;
  db_created_at: number;
};

export type InsertProfilerSession = {
  device_id: string;
  timestamp: number;
};

export type ProfilerCommitRow = {
  id: number;
  profiler_session_id: number;
  device_id: string;
  session_id: number;
  commit_index: number;
  timestamp: number;
  duration: number;
  components: string;
  db_created_at: number;
};

export type InsertProfilerCommit = {
  profiler_session_id: number;
  device_id: string;
  commit_index: number;
  timestamp: number;
  duration: number;
  components: string;
};

export type PerformanceMetricRow = {
  id: number;
  device_id: string;
  session_id: number;
  js_fps: number;
  ui_fps: number | null;
  ram: number | null;
  dropped_frames: number;
  gc_events: number;
  timestamp: number;
  db_created_at: number;
};

export type InsertPerformanceMetric = {
  device_id: string;
  js_fps: number;
  ui_fps: number | null;
  ram: number | null;
  dropped_frames: number;
  gc_events: number;
  timestamp: number;
};

export type QueryFilter = {
  device_id: string;
  limit?: number;
  offset?: number;
};

export type ConsoleQueryFilter = QueryFilter & {
  level?: LogLevel;
};

export type NetworkQueryFilter = QueryFilter & {
  method?: string;
  status?: number;
  graphql_type?: 'query' | 'mutation';
  pending?: boolean;
};

export type PerformanceQueryFilter = QueryFilter & {
  from_timestamp?: number;
  to_timestamp?: number;
};
