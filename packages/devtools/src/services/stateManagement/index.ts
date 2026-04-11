import type {
  RadarMessage,
  StateGetCommand,
  StateStoreInfo,
} from '@radar/types';
import type { RadarConfig } from '../../config';
import { detectStoreType } from '../storage/detectBackends';
import type { StoreRegistration } from '../storage/detectBackends';

const safeSerialize = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? '{}';
  } catch {
    return '{}';
  }
};

const computeChangedKeys = (
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): string[] => {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const key of allKeys) {
    if (prev[key] !== next[key]) {
      changed.push(key);
    }
  }
  return changed;
};

type ReduxStore = StoreRegistration & {
  dispatch: (action: Record<string, unknown>) => Record<string, unknown>;
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
      const storeType = detectStoreType(
        rawStore as Record<string, unknown>,
      );
      storeInfos.push({ name, storeType });

      if (storeType === 'redux') {
        // Redux: intercept dispatch to capture action type + payload
        const reduxStore = store as ReduxStore;
        const originalDispatch = reduxStore.dispatch.bind(reduxStore);
        reduxStore.dispatch = (
          action: Record<string, unknown>,
        ): Record<string, unknown> => {
          const result = originalDispatch(action);
          const newState = reduxStore.getState();
          send({
            type: 'stateAction',
            storeName: name,
            actionType: String(action.type ?? 'unknown'),
            payload: safeSerialize(action.payload ?? action),
            state: safeSerialize(newState),
            timestamp: Date.now(),
          });
          send({
            type: 'stateSnapshot',
            storeName: name,
            state: safeSerialize(newState),
            timestamp: Date.now(),
          });
          return result;
        };
      } else {
        // Zustand / other: subscribe and compute diff
        let prevState = store.getState();
        const unsub = store.subscribe(() => {
          const nextState = store.getState();
          const changed = computeChangedKeys(
            prevState as Record<string, unknown>,
            nextState as Record<string, unknown>,
          );
          const actionType =
            changed.length > 0
              ? `update: ${changed.join(', ')}`
              : 'state update';
          send({
            type: 'stateAction',
            storeName: name,
            actionType,
            payload: safeSerialize(
              Object.fromEntries(
                changed.map(k => [
                  k,
                  (nextState as Record<string, unknown>)[k],
                ]),
              ),
            ),
            state: safeSerialize(nextState),
            timestamp: Date.now(),
          });
          send({
            type: 'stateSnapshot',
            storeName: name,
            state: safeSerialize(nextState),
            timestamp: Date.now(),
          });
          prevState = nextState;
        });
        unsubscribers.push(unsub);
      }
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
