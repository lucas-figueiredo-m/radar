import { create } from 'zustand';

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

type TodoState = {
  todos: Todo[];
  filter: 'all' | 'active' | 'done';
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  setFilter: (filter: 'all' | 'active' | 'done') => void;
  clearCompleted: () => void;
};

export const useTodoStore = create<TodoState>(set => ({
  todos: [
    { id: '1', text: 'Test Radar storage inspector', done: false },
    { id: '2', text: 'Check MMKV integration', done: true },
    { id: '3', text: 'Verify state panel', done: false },
  ],
  filter: 'all',
  addTodo: (text: string) =>
    set(state => ({
      todos: [...state.todos, { id: Date.now().toString(), text, done: false }],
    })),
  toggleTodo: (id: string) =>
    set(state => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    })),
  removeTodo: (id: string) =>
    set(state => ({
      todos: state.todos.filter(t => t.id !== id),
    })),
  setFilter: (filter: 'all' | 'active' | 'done') => set({ filter }),
  clearCompleted: () =>
    set(state => ({
      todos: state.todos.filter(t => !t.done),
    })),
}));
