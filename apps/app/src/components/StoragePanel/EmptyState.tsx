import { Database, RefreshCw, WifiOff } from 'lucide-react';

export type EmptyStateProps = {
  connected: boolean;
  hasBackends: boolean;
  hasEntries: boolean;
  onRefresh: () => void;
};

export const EmptyState = ({
  connected,
  hasBackends,
  hasEntries,
  onRefresh,
}: EmptyStateProps) => {
  if (!connected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-secondary">
        <WifiOff size={32} className="text-text-disabled" />
        <p className="text-body">No device connected</p>
        <p className="text-detail text-text-disabled">
          Connect a device to inspect storage
        </p>
      </div>
    );
  }

  if (!hasBackends) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-secondary">
        <Database size={32} className="text-text-disabled" />
        <p className="text-body">No storage library detected</p>
        <p className="text-detail text-text-disabled text-center max-w-sm">
          Install{' '}
          <code className="text-text-secondary">
            @react-native-async-storage/async-storage
          </code>{' '}
          or <code className="text-text-secondary">react-native-mmkv</code> in
          your app
        </p>
      </div>
    );
  }

  if (!hasEntries) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-secondary">
        <Database size={32} className="text-text-disabled" />
        <p className="text-body">Storage is empty</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-detail text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>
    );
  }

  return null;
};
