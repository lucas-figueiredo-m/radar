import { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { ipcRenderer } from '../services';

export const DevToolsPanel = () => {
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const handleToggleInspector = () => {
    ipcRenderer?.send('radar:toggle-devtools');
    setInspectorOpen((prev) => !prev);
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex items-center justify-between p-3 rounded-md bg-bg-secondary border border-border-default">
        <div className="flex flex-col gap-0.5">
          <span className="text-text-primary text-[13px] font-semibold font-ui">
            Inspector
          </span>
          <span className="text-text-tertiary text-[11px] font-ui">
            Toggle Electron DevTools
          </span>
        </div>
        <button
          onClick={handleToggleInspector}
          className="bg-transparent border-none cursor-pointer p-0 flex items-center"
          title={inspectorOpen ? 'Close Inspector' : 'Open Inspector'}
        >
          {inspectorOpen ? (
            <ToggleRight size={28} className="text-accent" />
          ) : (
            <ToggleLeft size={28} className="text-text-secondary" />
          )}
        </button>
      </div>
    </div>
  );
};
