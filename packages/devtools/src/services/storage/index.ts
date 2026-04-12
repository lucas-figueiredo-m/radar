import type { RadarMessage, StorageCommand } from '@radar/types';
import type { RadarConfig } from '../../config';
import {
  detectAsyncStorage,
  detectMMKVDefault,
  buildStorageBackendInfos,
} from './detectBackends';
import type { MMKVAPI } from './detectBackends';
import { createAsyncStorageAdapter } from './asyncStorageAdapter';
import { createMMKVAdapter } from './mmkvAdapter';

export const createStorageService = (
  send: (message: RadarMessage) => void,
  config: RadarConfig,
) => {
  const asyncStorage = detectAsyncStorage();

  const asyncStorageAdapter = asyncStorage
    ? createAsyncStorageAdapter(asyncStorage)
    : null;

  const mmkvInstances: Record<string, MMKVAPI> = {};
  const mmkvAdapters: Record<string, ReturnType<typeof createMMKVAdapter>> = {};

  if (config.mmkvInstances) {
    for (const [name, instance] of Object.entries(config.mmkvInstances)) {
      const mmkv = instance as MMKVAPI;
      mmkvInstances[name] = mmkv;
      mmkvAdapters[name] = createMMKVAdapter(mmkv);
    }
  } else {
    const defaultInstance = detectMMKVDefault();
    if (defaultInstance) {
      mmkvInstances['default'] = defaultInstance;
      mmkvAdapters['default'] = createMMKVAdapter(defaultInstance);
    }
  }

  const backends = buildStorageBackendInfos(asyncStorage, mmkvInstances);

  const sendCapabilities = () => {
    send({
      type: 'storageCapabilities',
      backends,
      timestamp: Date.now(),
    });
  };

  const handleCommand = async (command: StorageCommand) => {
    try {
      const requestId = command.requestId;

      switch (command.type) {
        case 'storageGetAll': {
          if (command.backend === 'asyncStorage' && asyncStorageAdapter) {
            const entries = await asyncStorageAdapter.getAllEntries();
            send({
              type: 'storageData',
              requestId,
              backend: 'asyncStorage',
              entries,
              timestamp: Date.now(),
            });
          } else if (command.backend === 'mmkv') {
            const instanceId = command.instanceId ?? 'default';
            const adapter = mmkvAdapters[instanceId];
            if (adapter) {
              const entries = adapter.getAllEntries();
              send({
                type: 'storageData',
                requestId,
                backend: 'mmkv',
                instanceId,
                entries,
                timestamp: Date.now(),
              });
            }
          }
          break;
        }
        case 'storageSet': {
          if (command.backend === 'asyncStorage' && asyncStorageAdapter) {
            await asyncStorageAdapter.setEntry(command.key, command.value);
            const entries = await asyncStorageAdapter.getAllEntries();
            send({
              type: 'storageData',
              requestId,
              backend: 'asyncStorage',
              entries,
              timestamp: Date.now(),
            });
          } else if (command.backend === 'mmkv') {
            const instanceId = command.instanceId ?? 'default';
            const adapter = mmkvAdapters[instanceId];
            if (adapter) {
              adapter.setEntry(command.key, command.value, command.valueType);
              const entries = adapter.getAllEntries();
              send({
                type: 'storageData',
                requestId,
                backend: 'mmkv',
                instanceId,
                entries,
                timestamp: Date.now(),
              });
            }
          }
          break;
        }
        case 'storageRemove': {
          if (command.backend === 'asyncStorage' && asyncStorageAdapter) {
            await asyncStorageAdapter.removeEntry(command.key);
            const entries = await asyncStorageAdapter.getAllEntries();
            send({
              type: 'storageData',
              requestId,
              backend: 'asyncStorage',
              entries,
              timestamp: Date.now(),
            });
          } else if (command.backend === 'mmkv') {
            const instanceId = command.instanceId ?? 'default';
            const adapter = mmkvAdapters[instanceId];
            if (adapter) {
              adapter.removeEntry(command.key);
              const entries = adapter.getAllEntries();
              send({
                type: 'storageData',
                requestId,
                backend: 'mmkv',
                instanceId,
                entries,
                timestamp: Date.now(),
              });
            }
          }
          break;
        }
        case 'storageClear': {
          if (command.backend === 'asyncStorage' && asyncStorageAdapter) {
            await asyncStorageAdapter.clearAll();
            send({
              type: 'storageData',
              requestId,
              backend: 'asyncStorage',
              entries: [],
              timestamp: Date.now(),
            });
          } else if (command.backend === 'mmkv') {
            const instanceId = command.instanceId ?? 'default';
            const adapter = mmkvAdapters[instanceId];
            if (adapter) {
              adapter.clearAll();
              send({
                type: 'storageData',
                requestId,
                backend: 'mmkv',
                instanceId,
                entries: [],
                timestamp: Date.now(),
              });
            }
          }
          break;
        }
      }
    } catch {
      // Silently ignore storage command errors to avoid crashing the app
    }
  };

  return { sendCapabilities, handleCommand };
};
