export type StorageBackend = 'asyncStorage' | 'mmkv';

export type StorageValueType = 'string' | 'number' | 'boolean';

export type StorageEntry = {
  key: string;
  value: string;
  valueType: StorageValueType;
};

export type StorageBackendInfo = {
  backend: StorageBackend;
  available: boolean;
  instanceId?: string;
};

export type StorageCapabilitiesMessage = {
  type: 'storageCapabilities';
  backends: StorageBackendInfo[];
  timestamp: number;
};

export type StorageDataMessage = {
  type: 'storageData';
  requestId: string;
  backend: StorageBackend;
  instanceId?: string;
  entries: StorageEntry[];
  timestamp: number;
};

export type StorageGetAllCommand = {
  type: 'storageGetAll';
  requestId: string;
  backend: StorageBackend;
  instanceId?: string;
};

export type StorageSetCommand = {
  type: 'storageSet';
  requestId: string;
  backend: StorageBackend;
  instanceId?: string;
  key: string;
  value: string;
  valueType: StorageValueType;
};

export type StorageRemoveCommand = {
  type: 'storageRemove';
  requestId: string;
  backend: StorageBackend;
  instanceId?: string;
  key: string;
};

export type StorageClearCommand = {
  type: 'storageClear';
  requestId: string;
  backend: StorageBackend;
  instanceId?: string;
};

export type StorageCommand =
  | StorageGetAllCommand
  | StorageSetCommand
  | StorageRemoveCommand
  | StorageClearCommand;
