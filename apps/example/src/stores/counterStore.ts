import { configureStore, createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: {
    count: 0,
    lastAction: 'none',
  },
  reducers: {
    increment: state => {
      state.count += 1;
      state.lastAction = 'increment';
    },
    decrement: state => {
      state.count -= 1;
      state.lastAction = 'decrement';
    },
    reset: state => {
      state.count = 0;
      state.lastAction = 'reset';
    },
  },
});

export const { increment, decrement, reset } = counterSlice.actions;

export const counterStore = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});

export type RootState = ReturnType<typeof counterStore.getState>;
