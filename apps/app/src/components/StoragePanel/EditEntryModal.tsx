import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import type { StorageEntryRow } from '@radar/database';
import type { StorageBackend, StorageValueType } from '@radar/types';

export type EditEntryModalProps = {
  entry: StorageEntryRow | null;
  backend: StorageBackend;
  visible: boolean;
  onSave: (key: string, value: string, valueType: StorageValueType) => void;
  onCancel: () => void;
};

export const EditEntryModal = ({
  entry,
  backend,
  visible,
  onSave,
  onCancel,
}: EditEntryModalProps) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [valueType, setValueType] = useState<StorageValueType>('string');
  const [error, setError] = useState<string | null>(null);

  const isNew = entry === null;

  useEffect(() => {
    if (visible) {
      if (entry) {
        setKey(entry.key);
        setValue(entry.value);
        setValueType(entry.value_type);
      } else {
        setKey('');
        setValue('');
        setValueType('string');
      }
      setError(null);
    }
  }, [visible, entry]);

  const validate = useCallback((): boolean => {
    if (!key.trim()) {
      setError('Key is required');
      return false;
    }
    if (valueType === 'number' && Number.isNaN(Number(value))) {
      setError('Value must be a valid number');
      return false;
    }
    if (valueType === 'boolean' && value !== 'true' && value !== 'false') {
      setError('Value must be "true" or "false"');
      return false;
    }
    setError(null);
    return true;
  }, [key, value, valueType]);

  const handleSave = () => {
    if (validate()) {
      onSave(key, value, valueType);
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && e.metaKey) handleSave();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-bg-surface border border-border-default rounded-lg shadow-lg w-[480px] max-h-[80vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <span className="text-body text-text-primary font-medium">
            {isNew ? 'Add Entry' : 'Edit Entry'}
          </span>
          <button
            onClick={onCancel}
            className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-detail text-text-secondary mb-1">
              Key
            </label>
            <input
              type="text"
              value={key}
              onChange={e => setKey(e.target.value)}
              readOnly={!isNew}
              className={`w-full bg-bg-base text-text-primary text-detail px-3 py-2 rounded border border-border-subtle outline-none font-mono ${
                !isNew
                  ? 'opacity-60 cursor-default'
                  : 'focus:border-border-focus'
              }`}
              placeholder="key.name"
              autoFocus={isNew}
            />
          </div>

          <div>
            <label className="block text-detail text-text-secondary mb-1">
              Value
            </label>
            <textarea
              value={value}
              onChange={e => setValue(e.target.value)}
              rows={6}
              className="w-full bg-bg-base text-text-primary text-detail px-3 py-2 rounded border border-border-subtle outline-none font-mono resize-y focus:border-border-focus"
              placeholder="value"
              autoFocus={!isNew}
            />
          </div>

          {backend === 'mmkv' && (
            <div>
              <label className="block text-detail text-text-secondary mb-1">
                Type
              </label>
              <select
                value={valueType}
                onChange={e => setValueType(e.target.value as StorageValueType)}
                className="bg-bg-base text-text-primary text-detail px-3 py-2 rounded border border-border-subtle outline-none"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>
          )}

          {error && <p className="text-detail text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-detail text-text-secondary hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-detail text-text-primary bg-bg-active rounded hover:bg-bg-hover transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
