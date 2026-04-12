import Database from 'better-sqlite3';
import { CREATE_TABLES_SQL } from './schema';
import {
  createConsoleRepository,
  createNetworkRepository,
  createComponentTreeRepository,
  createInspectedComponentRepository,
  createProfilerRepository,
  createPerformanceRepository,
  createStorageRepository,
  createStateRepository,
} from './repositories';
import type {
  ConsoleRepository,
  NetworkRepository,
  ComponentTreeRepository,
  InspectedComponentRepository,
  ProfilerRepository,
  PerformanceRepository,
  StorageRepository,
  StateRepository,
} from './repositories';

export type RadarDatabase = {
  console: ConsoleRepository;
  network: NetworkRepository;
  componentTree: ComponentTreeRepository;
  inspectedComponent: InspectedComponentRepository;
  profiler: ProfilerRepository;
  performance: PerformanceRepository;
  storage: StorageRepository;
  state: StateRepository;
  close: () => void;
  raw: Database.Database;
};

export const createDatabase = (): RadarDatabase => {
  const db = new Database(':memory:');

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(CREATE_TABLES_SQL);

  return {
    console: createConsoleRepository(db),
    network: createNetworkRepository(db),
    componentTree: createComponentTreeRepository(db),
    inspectedComponent: createInspectedComponentRepository(db),
    profiler: createProfilerRepository(db),
    performance: createPerformanceRepository(db),
    storage: createStorageRepository(db),
    state: createStateRepository(db),
    close: () => db.close(),
    raw: db,
  };
};
