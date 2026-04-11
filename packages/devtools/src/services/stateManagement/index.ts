import type {
  RadarMessage,
  StateGetCommand,
  StateStoreInfo,
} from '@radar/types';
import type { RadarConfig } from '../../config';
import { detectStoreType } from '../storage/detectBackends';
import type { StoreRegistration } from '../storage/detectBackends';

type Serialize = (value: unknown) => string;

const safeSerialize: Serialize = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? '{}';
  } catch {
    return '{}';
  }
};

export const createStateService = (
  send: (message: RadarMessage) => void,
  config: RadarConfig,
) => {
  const stores = new Map<string, StoreRegistration>();
  const unsubscribers: (() => void)[] = [];
  const storeInfos: StateStoreInfo[] = [];

  if (config.stores) {
    for (const [name, rawStore] of Object.entries(config.stores)) {
      const store = rawStore as StoreRegistration;
      if (
        typeof store.getState !== 'function' ||
        typeof store.subscribe !== 'function'
      ) {
        continue;
      }

      stores.set(name, store);
      const storeType = detectStoreType(rawStore as Record<string, unknown>);
      storeInfos.push({ name, storeType });

      // Redux subscribe passes no args; Zustand passes the new state.
      // Use getState() in both cases for consistency.
      const unsub = store.subscribe(() => {
        send({
          type: 'stateSnapshot',
          storeName: name,
          state: safeSerialize(store.getState()),
          timestamp: Date.now(),
        });
      });
      unsubscribers.push(unsub);
    }
  }

  const sendCapabilities = () => {
    send({
      type: 'stateCapabilities',
      stores: storeInfos,
      timestamp: Date.now(),
    });
  };

  const sendAllSnapshots = () => {
    for (const [name, store] of stores) {
      send({
        type: 'stateSnapshot',
        storeName: name,
        state: safeSerialize(store.getState()),
        timestamp: Date.now(),
      });
    }
  };

  const handleCommand = (command: StateGetCommand) => {
    if (command.type === 'stateGet') {
      const store = stores.get(command.storeName);
      if (store) {
        send({
          type: 'stateSnapshot',
          storeName: command.storeName,
          state: safeSerialize(store.getState()),
          timestamp: Date.now(),
        });
      }
    }
  };

  return {
    sendCapabilities,
    sendAllSnapshots,
    handleCommand,
    destroy: () => unsubscribers.forEach(u => u()),
  };
};
