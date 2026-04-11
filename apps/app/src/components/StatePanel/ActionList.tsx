import { useRef, useEffect } from 'react';
import type { StateActionRow } from '@radar/database';

export type ActionListProps = {
  actions: StateActionRow[];
  selectedActionId: number | null;
  onSelectAction: (id: number | null) => void;
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const truncatePayload = (payload: string, maxLen = 60): string => {
  if (payload === '{}' || payload === 'null') return '';
  if (payload.length <= maxLen) return payload;
  return payload.slice(0, maxLen) + '...';
};

export const ActionList = ({
  actions,
  selectedActionId,
  onSelectAction,
}: ActionListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedActionId === null) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [actions.length, selectedActionId]);

  if (actions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-disabled text-detail">
        No actions yet
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {actions.map(action => {
        const isSelected = action.id === selectedActionId;
        const payloadPreview = truncatePayload(action.payload);

        return (
          <div
            key={action.id}
            onClick={() =>
              onSelectAction(isSelected ? null : action.id)
            }
            className={`flex flex-col gap-0.5 px-3 py-1.5 cursor-pointer border-b border-border-subtle transition-colors ${
              isSelected
                ? 'bg-bg-active'
                : 'hover:bg-bg-hover'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-detail text-text-primary font-medium truncate">
                {action.action_type}
              </span>
              <span className="text-[10px] text-text-disabled ml-auto shrink-0">
                {formatTime(action.timestamp)}
              </span>
            </div>
            {payloadPreview && (
              <span className="text-[11px] text-text-secondary font-mono truncate">
                {payloadPreview}
              </span>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
