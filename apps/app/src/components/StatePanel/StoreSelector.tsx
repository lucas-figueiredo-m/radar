import type { StateCapabilityRow } from '@radar/database';
import { STORE_TYPE_LABELS, STORE_TYPE_COLORS } from './constants';
import type { StateStoreType } from '@radar/types';

export type StoreSelectorProps = {
  capabilities: StateCapabilityRow[];
  selectedStore: string | null;
  onSelectStore: (storeName: string) => void;
};

export const StoreSelector = ({
  capabilities,
  selectedStore,
  onSelectStore,
}: StoreSelectorProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle shrink-0">
      <div className="flex gap-1">
        {capabilities.map(cap => (
          <button
            key={cap.store_name}
            onClick={() => onSelectStore(cap.store_name)}
            className={`flex items-center gap-1.5 px-3 py-1 text-detail rounded transition-colors ${
              selectedStore === cap.store_name
                ? 'bg-bg-active text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            {cap.store_name}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${STORE_TYPE_COLORS[cap.store_type as StateStoreType]}`}
            >
              {STORE_TYPE_LABELS[cap.store_type as StateStoreType]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
