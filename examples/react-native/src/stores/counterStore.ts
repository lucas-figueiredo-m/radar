import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

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
    incrementBy: (state, action: PayloadAction<number>) => {
      state.count += action.payload;
      state.lastAction = `incrementBy(${action.payload})`;
    },
  },
});

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [] as Todo[],
    filter: 'all' as 'all' | 'active' | 'done',
  },
  reducers: {
    addTodo: (state, action: PayloadAction<{ id: string; text: string }>) => {
      state.items.push({ id: action.payload.id, text: action.payload.text, done: false });
    },
    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) todo.done = !todo.done;
    },
    removeTodo: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
    setFilter: (state, action: PayloadAction<'all' | 'active' | 'done'>) => {
      state.filter = action.payload;
    },
  },
});

export const { increment, decrement, reset, incrementBy } = counterSlice.actions;
export const { addTodo, toggleTodo, removeTodo, setFilter } = todosSlice.actions;

export const counterStore = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    todos: todosSlice.reducer,
  },
});

export type RootState = ReturnType<typeof counterStore.getState>;
