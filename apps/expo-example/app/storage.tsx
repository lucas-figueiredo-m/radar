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
import { createMMKV } from 'react-native-mmkv';
import { useTodoStore } from '../stores/todoStore';

const storage = createMMKV();
const settingsStorage = createMMKV({ id: 'settings' });

const StorageScreen = () => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [newTodo, setNewTodo] = useState('');

  const { todos, filter, addTodo, toggleTodo, removeTodo, setFilter, clearCompleted } =
    useTodoStore();

  const loadKeys = () => {
    setAllKeys(storage.getAllKeys());
  };

  useEffect(() => {
    // Seed some test data with different types
    if (storage.getAllKeys().length === 0) {
      storage.set('user.name', 'Jane Smith');
      storage.set('user.age', 28);
      storage.set('user.premium', true);
      storage.set(
        'cache.userData',
        JSON.stringify({ avatar: 'https://example.com/avatar.jpg', role: 'admin' }),
      );
      storage.set('app.rating', 4.5);
      storage.set('app.hasOnboarded', false);
    }
    if (settingsStorage.getAllKeys().length === 0) {
      settingsStorage.set('theme', 'dark');
      settingsStorage.set('language', 'en');
      settingsStorage.set('notifications', true);
      settingsStorage.set('fontSize', 16);
      settingsStorage.set('autoSave', true);
      settingsStorage.set('syncInterval', 300);
    }
    loadKeys();
  }, []);

  const handleSet = () => {
    if (!key.trim()) return;
    storage.set(key, value);
    setKey('');
    setValue('');
    loadKeys();
  };

  const handleRemove = (k: string) => {
    storage.remove(k);
    loadKeys();
  };

  const handleClear = () => {
    storage.clearAll();
    loadKeys();
  };

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    addTodo(newTodo);
    setNewTodo('');
  };

  const filteredTodos =
    filter === 'all'
      ? todos
      : filter === 'active'
        ? todos.filter(t => !t.done)
        : todos.filter(t => t.done);

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>MMKV Storage</Text>
      <Text style={styles.subtitle}>
        {allKeys.length} keys (strings, numbers, booleans)
      </Text>

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

      {allKeys.map(k => (
        <View key={k} style={styles.keyRow}>
          <Text style={styles.keyText}>{k}</Text>
          <TouchableOpacity onPress={() => handleRemove(k)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
        <Text style={styles.btnText}>Clear All</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        MMKV Settings Instance
      </Text>
      <Text style={styles.subtitle}>
        {settingsStorage.getAllKeys().length} keys
      </Text>

      {settingsStorage.getAllKeys().map(k => {
        const val = settingsStorage.getString(k) ?? String(settingsStorage.getNumber(k) ?? settingsStorage.getBoolean(k) ?? '');
        return (
          <View key={k} style={styles.keyRow}>
            <Text style={styles.keyText}>{k}</Text>
            <Text style={styles.valueText} numberOfLines={1}>{val}</Text>
          </View>
        );
      })}

      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            settingsStorage.set('theme', settingsStorage.getString('theme') === 'dark' ? 'light' : 'dark');
            loadKeys();
          }}
        >
          <Text style={styles.btnText}>Toggle Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => {
            settingsStorage.set('notifications', !settingsStorage.getBoolean('notifications'));
            loadKeys();
          }}
        >
          <Text style={styles.btnText}>Toggle Notifs</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
        Zustand Todo Store
      </Text>

      <View style={styles.filterRow}>
        {(['all', 'active', 'done'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newTodo}
          onChangeText={setNewTodo}
          placeholder="Add a todo..."
          placeholderTextColor="#64748b"
          onSubmitEditing={handleAddTodo}
        />
        <TouchableOpacity style={styles.btn} onPress={handleAddTodo}>
          <Text style={styles.btnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {filteredTodos.map(todo => (
        <View key={todo.id} style={styles.todoRow}>
          <TouchableOpacity
            onPress={() => toggleTodo(todo.id)}
            style={styles.todoCheckbox}
          >
            <Text style={{ fontSize: 16 }}>{todo.done ? '✓' : '○'}</Text>
          </TouchableOpacity>
          <Text
            style={[styles.todoText, todo.done && styles.todoDone]}
          >
            {todo.text}
          </Text>
          <TouchableOpacity onPress={() => removeTodo(todo.id)}>
            <Text style={styles.deleteText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      {todos.some(t => t.done) && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearCompleted}>
          <Text style={styles.btnText}>Clear Completed</Text>
        </TouchableOpacity>
      )}

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
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  keyText: { color: '#e2e8f0', fontSize: 14, fontFamily: 'Courier' },
  deleteText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  filterBtnActive: { backgroundColor: '#6366f1' },
  filterText: { color: '#94a3b8', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  todoCheckbox: { width: 28 },
  todoText: { color: '#e2e8f0', fontSize: 14, flex: 1 },
  todoDone: { textDecorationLine: 'line-through', color: '#64748b' },
});

export default StorageScreen;
