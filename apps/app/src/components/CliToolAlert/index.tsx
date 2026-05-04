import { useState } from 'react';
import { X } from 'lucide-react';
import type { CliToolStatus } from '../../types';

type CliToolAlertProps = {
  cliToolStatuses: CliToolStatus[];
};

const TOOL_PLATFORM_MAP = {
  xcrun: 'iOS simulator',
  adb: 'Android emulator',
} as const;

export const CliToolAlert = ({ cliToolStatuses }: CliToolAlertProps) => {
  const [dismissed, setDismissed] = useState(false);

  const unavailableTools = cliToolStatuses.filter(s => !s.available);

  if (dismissed || unavailableTools.length === 0) {
    return null;
  }

  return (
    <div className="bg-status-warning/10 border-b border-status-warning/20 text-status-warning px-4 py-1.5 flex items-center justify-between shrink-0">
      <div className="flex flex-col gap-0.5">
        {unavailableTools.map(tool => (
          <span key={tool.tool} className="text-detail">
            {tool.tool} not found &mdash; {TOOL_PLATFORM_MAP[tool.tool]}{' '}
            detection unavailable
          </span>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-status-warning hover:text-status-warning-hover cursor-pointer transition-colors shrink-0 ml-3"
      >
        <X size={14} />
      </button>
    </div>
  );
};
