import { Layers, WifiOff } from 'lucide-react';

export type StateEmptyStateProps = {
  connected: boolean;
  hasStores: boolean;
};

export const StateEmptyState = ({
  connected,
  hasStores,
}: StateEmptyStateProps) => {
  if (!connected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-secondary">
        <WifiOff size={32} className="text-text-disabled" />
        <p className="text-body">No device connected</p>
        <p className="text-detail text-text-disabled">
          Connect a device to inspect state
        </p>
      </div>
    );
  }

  if (!hasStores) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-secondary">
        <Layers size={32} className="text-text-disabled" />
        <p className="text-body">No stores registered</p>
        <p className="text-detail text-text-disabled text-center max-w-sm">
          Pass your stores to Radar&apos;s init config:
        </p>
        <code className="text-detail text-text-secondary bg-bg-surface px-3 py-2 rounded border border-border-subtle font-mono">
          init({'{'} stores: {'{'} myStore {'}'} {'}'})
        </code>
      </div>
    );
  }

  return null;
};
