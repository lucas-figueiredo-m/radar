import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  counterStore,
  increment,
  decrement,
  reset,
  incrementBy,
  addTodo,
  toggleTodo,
  removeTodo,
} from '../stores/counterStore';

const StorageScreen = () => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [allEntries, setAllEntries] = useState<[string, string | null][]>([]);

  const [reduxState, setReduxState] = useState(counterStore.getState());

  useEffect(() => {
    const unsub = counterStore.subscribe(() => {
      setReduxState(counterStore.getState());
    });
    return unsub;
  }, []);

  const { count, lastAction } = reduxState.counter;
  const { items: todos } = reduxState.todos;
  const [todoText, setTodoText] = useState('');

  const loadKeys = async () => {
    const keys = await AsyncStorage.getAllKeys();
    // v3 uses getMany (returns Record), v2 uses multiGet (returns tuples)
    if (typeof AsyncStorage.getMany === 'function') {
      const record = await AsyncStorage.getMany(keys);
      setAllEntries(Object.entries(record));
    } else if (typeof AsyncStorage.multiGet === 'function') {
      const pairs = await AsyncStorage.multiGet(keys);
      setAllEntries(pairs);
    } else {
      const pairs: [string, string | null][] = [];
      for (const k of keys) {
        pairs.push([k, await AsyncStorage.getItem(k)]);
      }
      setAllEntries(pairs);
    }
  };

  useEffect(() => {
    loadKeys();
    // Seed some test data on first load
    const seedData = async () => {
      const existing = await AsyncStorage.getAllKeys();
      if (existing.length === 0) {
        await AsyncStorage.setItem('user.name', 'John Doe');
        await AsyncStorage.setItem('user.email', 'john@example.com');
        await AsyncStorage.setItem(
          'settings.theme',
          JSON.stringify({ mode: 'dark', accent: '#6366f1' }),
        );
        await AsyncStorage.setItem('app.launchCount', '5');
        await AsyncStorage.setItem('cache.lastSync', new Date().toISOString());
        loadKeys();
      }
    };
    seedData();
  }, []);

  const handleSet = async () => {
    if (!key.trim()) return;
    await AsyncStorage.setItem(key, value);
    setKey('');
    setValue('');
    loadKeys();
  };

  const handleRemove = async (k: string) => {
    await AsyncStorage.removeItem(k);
    loadKeys();
  };

  const handleClear = async () => {
    await AsyncStorage.clear();
    loadKeys();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>AsyncStorage</Text>
      <Text style={styles.subtitle}>{allEntries.length} keys stored</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={key}
          onChangeText={setKey}
          placeholder="key"
          placeholderTextColor="#64748b"
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="value"
          placeholderTextColor="#64748b"
        />
        <TouchableOpacity style={styles.btn} onPress={handleSet}>
          <Text style={styles.btnText}>Set</Text>
        </TouchableOpacity>
      </View>

      {allEntries.map(([k, v]) => (
        <View key={k} style={styles.keyRow}>
          <Text style={styles.keyText} numberOfLines={1}>{k}</Text>
          <Text style={styles.valueText} numberOfLines={1}>{v}</Text>
          <TouchableOpacity onPress={() => handleRemove(k)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.btnText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadKeys}>
          <Text style={styles.btnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        Redux Counter Store
      </Text>
      <Text style={styles.subtitle}>
        Count: {count} | Last: {lastAction}
      </Text>

      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.btn} onPress={() => counterStore.dispatch(decrement())}>
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>{count}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => counterStore.dispatch(increment())}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => counterStore.dispatch(incrementBy(5))}>
          <Text style={styles.btnText}>+5</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearBtn} onPress={() => counterStore.dispatch(reset())}>
          <Text style={styles.btnText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        Redux Todos Slice
      </Text>
      <Text style={styles.subtitle}>{todos.length} items</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={todoText}
          onChangeText={setTodoText}
          placeholder="Add a todo..."
          placeholderTextColor="#64748b"
          onSubmitEditing={() => {
            if (todoText.trim()) {
              counterStore.dispatch(addTodo({ id: Date.now().toString(), text: todoText }));
              setTodoText('');
            }
          }}
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            if (todoText.trim()) {
              counterStore.dispatch(addTodo({ id: Date.now().toString(), text: todoText }));
              setTodoText('');
            }
          }}
        >
          <Text style={styles.btnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {todos.map(todo => (
        <View key={todo.id} style={styles.keyRow}>
          <TouchableOpacity onPress={() => counterStore.dispatch(toggleTodo(todo.id))}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>{todo.done ? '✓' : '○'}</Text>
          </TouchableOpacity>
          <Text
            style={[styles.valueText, todo.done && { textDecorationLine: 'line-through', color: '#64748b' }]}
            numberOfLines={1}
          >
            {todo.text}
          </Text>
          <TouchableOpacity onPress={() => counterStore.dispatch(removeTodo(todo.id))}>
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 16 },
  sectionTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  clearBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  keyText: { color: '#e2e8f0', fontSize: 13, fontFamily: 'Courier', fontWeight: '600', minWidth: 100 },
  valueText: { color: '#94a3b8', fontSize: 12, fontFamily: 'Courier', flex: 1, marginLeft: 8 },
  deleteText: { color: '#ef4444', fontSize: 13 },
  countText: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
});

export default StorageScreen;
