export type StateStoreType = 'zustand' | 'redux' | 'other';

export type StateStoreInfo = {
  name: string;
  storeType: StateStoreType;
};

export type StateCapabilitiesMessage = {
  type: 'stateCapabilities';
  stores: StateStoreInfo[];
  timestamp: number;
};

export type StateSnapshotMessage = {
  type: 'stateSnapshot';
  storeName: string;
  state: string;
  timestamp: number;
};

export type StateActionMessage = {
  type: 'stateAction';
  storeName: string;
  actionType: string;
  payload: string;
  state: string;
  timestamp: number;
};

export type StateGetCommand = {
  type: 'stateGet';
  storeName: string;
};
