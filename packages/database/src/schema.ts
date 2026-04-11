export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS console_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    level           TEXT NOT NULL CHECK (level IN ('log', 'warn', 'error', 'debug')),
    args            TEXT NOT NULL,
    timestamp       INTEGER NOT NULL,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_console_device_ts ON console_logs(device_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_console_level ON console_logs(device_id, level);

  CREATE TABLE IF NOT EXISTS network_requests (
    id                  TEXT PRIMARY KEY,
    device_id           TEXT NOT NULL,
    method              TEXT NOT NULL,
    url                 TEXT NOT NULL,
    request_headers     TEXT,
    request_body        TEXT,
    graphql_type        TEXT CHECK (graphql_type IN ('query', 'mutation')),
    graphql_name        TEXT,
    status              INTEGER,
    status_text         TEXT,
    response_headers    TEXT,
    response_body       TEXT,
    duration            REAL,
    pending             INTEGER NOT NULL DEFAULT 1,
    timestamp           INTEGER NOT NULL,
    response_timestamp  INTEGER,
    db_created_at       INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000),
    db_updated_at       INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_network_device_ts ON network_requests(device_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_network_method ON network_requests(device_id, method);
  CREATE INDEX IF NOT EXISTS idx_network_status ON network_requests(device_id, status);
  CREATE INDEX IF NOT EXISTS idx_network_graphql ON network_requests(device_id, graphql_type);

  CREATE TABLE IF NOT EXISTS component_trees (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    session_id      INTEGER NOT NULL DEFAULT 1,
    root_nodes      TEXT NOT NULL,
    timestamp       INTEGER NOT NULL,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_tree_device ON component_trees(device_id, timestamp);

  CREATE TABLE IF NOT EXISTS inspected_components (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    session_id      INTEGER NOT NULL DEFAULT 1,
    component_id    TEXT NOT NULL,
    data            TEXT NOT NULL,
    timestamp       INTEGER NOT NULL,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_inspected_device_component ON inspected_components(device_id, component_id);

  CREATE TABLE IF NOT EXISTS profiler_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    session_id      INTEGER NOT NULL DEFAULT 1,
    timestamp       INTEGER NOT NULL,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_profiler_session_device ON profiler_sessions(device_id);

  CREATE TABLE IF NOT EXISTS profiler_commits (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    profiler_session_id INTEGER NOT NULL REFERENCES profiler_sessions(id) ON DELETE CASCADE,
    device_id       TEXT NOT NULL,
    session_id      INTEGER NOT NULL DEFAULT 1,
    commit_index    INTEGER NOT NULL,
    timestamp       INTEGER NOT NULL,
    duration        REAL NOT NULL,
    components      TEXT NOT NULL,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_commit_session ON profiler_commits(profiler_session_id);
  CREATE INDEX IF NOT EXISTS idx_commit_device_ts ON profiler_commits(device_id, timestamp);

  CREATE TABLE IF NOT EXISTS performance_metrics (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    session_id      INTEGER NOT NULL DEFAULT 1,
    js_fps          REAL NOT NULL,
    ui_fps          REAL,
    js_heap         REAL,
    native_ram      REAL,
    cpu_usage       REAL,
    dropped_frames  INTEGER NOT NULL,
    gc_events       INTEGER NOT NULL,
    timestamp       INTEGER NOT NULL,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE INDEX IF NOT EXISTS idx_perf_device_ts ON performance_metrics(device_id, timestamp);

  CREATE TABLE IF NOT EXISTS storage_capabilities (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    backend         TEXT NOT NULL CHECK (backend IN ('asyncStorage', 'mmkv')),
    available       INTEGER NOT NULL,
    instance_id     TEXT,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_cap_device_backend
    ON storage_capabilities(device_id, backend, COALESCE(instance_id, ''));

  CREATE TABLE IF NOT EXISTS storage_entries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    backend         TEXT NOT NULL CHECK (backend IN ('asyncStorage', 'mmkv')),
    instance_id     TEXT,
    key             TEXT NOT NULL,
    value           TEXT NOT NULL,
    value_type      TEXT NOT NULL CHECK (value_type IN ('string', 'number', 'boolean')),
    timestamp       INTEGER NOT NULL,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_entry_unique
    ON storage_entries(device_id, backend, COALESCE(instance_id, ''), key);

  CREATE INDEX IF NOT EXISTS idx_storage_device_backend
    ON storage_entries(device_id, backend);

  CREATE TABLE IF NOT EXISTS state_capabilities (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    store_name      TEXT NOT NULL,
    store_type      TEXT NOT NULL CHECK (store_type IN ('zustand', 'redux', 'other')),
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_state_cap_device_store
    ON state_capabilities(device_id, store_name);

  CREATE TABLE IF NOT EXISTS state_snapshots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id       TEXT NOT NULL,
    store_name      TEXT NOT NULL,
    state           TEXT NOT NULL,
    timestamp       INTEGER NOT NULL,
    db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_state_snapshot_device_store
    ON state_snapshots(device_id, store_name);
`;
