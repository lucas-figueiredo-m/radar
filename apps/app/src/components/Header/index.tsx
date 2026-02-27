interface HeaderProps {
  connected: boolean;
  onClear: () => void;
}

export const Header = ({ connected, onClear }: HeaderProps) => (
  <div className="flex items-center justify-between px-4 h-[var(--toolbar-height)] border-b border-border-default shrink-0 bg-bg-header">
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold font-display text-text-primary">Radar</span>
      <span className="text-xs text-text-tertiary">v0.1.0</span>
      <span className="text-xs text-text-disabled">&mdash;</span>
      <span className="text-xs text-text-tertiary">iPhone 15 Pro &mdash; iOS 17.2 /</span>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-status-success' : 'bg-status-error'
          }`}
        />
        <span className="text-xs text-text-tertiary">
          {connected ? 'Connected' : 'Waiting for app...'}
        </span>
      </div>
      <button
        onClick={onClear}
        className="px-2.5 py-1 bg-bg-elevated border-none rounded-md text-text-primary cursor-pointer text-xs hover:bg-bg-overlay transition-colors"
      >
        Clear
      </button>
    </div>
  </div>
);
