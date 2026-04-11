import type { StorageCapabilityRow } from '@radar/database';
import type { StorageBackend } from '@radar/types';
import { BACKEND_LABELS } from './constants';

export type BackendSelectorProps = {
  capabilities: StorageCapabilityRow[];
  selectedBackend: StorageBackend;
  selectedInstance: string | undefined;
  onSelectBackend: (backend: StorageBackend) => void;
  onSelectInstance: (instanceId: string | undefined) => void;
};

export const BackendSelector = ({
  capabilities,
  selectedBackend,
  selectedInstance,
  onSelectBackend,
  onSelectInstance,
}: BackendSelectorProps) => {
  const backends = (['asyncStorage', 'mmkv'] as const).map(backend => {
    const caps = capabilities.filter(c => c.backend === backend);
    const available = caps.some(c => c.available);
    return { backend, available, instances: caps };
  });

  const mmkvInstances = capabilities.filter(
    c => c.backend === 'mmkv' && c.available,
  );
  const showInstancePicker =
    selectedBackend === 'mmkv' && mmkvInstances.length > 1;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle shrink-0">
      <div className="flex gap-1">
        {backends.map(({ backend, available }) => (
          <button
            key={backend}
            onClick={() => available && onSelectBackend(backend)}
            className={`px-3 py-1 text-detail rounded transition-colors ${
              selectedBackend === backend
                ? 'bg-bg-active text-text-primary'
                : available
                ? 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                : 'text-text-disabled cursor-default opacity-40'
            }`}
            title={
              available
                ? BACKEND_LABELS[backend]
                : `${BACKEND_LABELS[backend]} — not installed`
            }
          >
            {BACKEND_LABELS[backend]}
            {!available && (
              <span className="ml-1 text-text-disabled text-[10px]">(n/a)</span>
            )}
          </button>
        ))}
      </div>

      {showInstancePicker && (
        <>
          <div className="w-px h-4 bg-border-subtle" />
          <select
            value={selectedInstance ?? 'default'}
            onChange={e =>
              onSelectInstance(
                e.target.value === 'default' ? undefined : e.target.value,
              )
            }
            className="bg-bg-surface text-text-primary text-detail px-2 py-1 rounded border border-border-subtle outline-none"
          >
            {mmkvInstances.map(c => (
              <option
                key={c.instance_id ?? 'default'}
                value={c.instance_id ?? 'default'}
              >
                {c.instance_id ?? 'default'}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
};
