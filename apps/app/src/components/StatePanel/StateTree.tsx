import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { SYNTAX_COLORS } from '../ValueRenderer';

export type StateTreeProps = {
  data: Record<string, unknown>;
  searchQuery: string;
};

type StateNodeProps = {
  keyName: string;
  value: unknown;
  depth: number;
  searchQuery: string;
};

const matchesSearch = (key: string, value: unknown, query: string): boolean => {
  if (!query) return true;
  const lower = query.toLowerCase();
  if (key.toLowerCase().includes(lower)) return true;
  if (typeof value === 'string' && value.toLowerCase().includes(lower))
    return true;
  if (
    (typeof value === 'number' || typeof value === 'boolean') &&
    String(value).toLowerCase().includes(lower)
  )
    return true;
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).some(([k, v]) => matchesSearch(k, v, query));
  }
  return false;
};

const renderPrimitive = (value: unknown): React.ReactNode => {
  if (value === null) {
    return <span style={{ color: SYNTAX_COLORS.null }}>null</span>;
  }
  if (value === undefined) {
    return <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>;
  }
  if (typeof value === 'string') {
    return (
      <span style={{ color: SYNTAX_COLORS.string }}>
        &quot;{value}&quot;
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span style={{ color: SYNTAX_COLORS.number }}>{value}</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span style={{ color: SYNTAX_COLORS.boolean }}>
        {String(value)}
      </span>
    );
  }
  return <span className="text-text-secondary">{String(value)}</span>;
};

const StateNode = ({ keyName, value, depth, searchQuery }: StateNodeProps) => {
  const [expanded, setExpanded] = useState(depth < 2);

  const toggle = useCallback(() => setExpanded(prev => !prev), []);

  const isObject =
    typeof value === 'object' && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  if (searchQuery && !matchesSearch(keyName, value, searchQuery)) {
    return null;
  }

  const entries = isExpandable
    ? Object.entries(value as Record<string, unknown>)
    : [];

  const preview = isArray
    ? `Array(${(value as unknown[]).length})`
    : isObject
      ? `{${Object.keys(value as Record<string, unknown>).length}}`
      : null;

  return (
    <div style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
      <div
        className={`flex items-center gap-1 py-0.5 px-1 rounded ${isExpandable ? 'cursor-pointer hover:bg-bg-hover' : ''}`}
        onClick={isExpandable ? toggle : undefined}
      >
        {isExpandable ? (
          expanded ? (
            <ChevronDown size={12} className="text-text-disabled shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-text-disabled shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}

        <span className="text-detail" style={{ color: SYNTAX_COLORS.key }}>
          {keyName}
        </span>
        <span className="text-text-disabled text-detail">:</span>

        {isExpandable && !expanded && (
          <span className="text-detail text-text-disabled ml-1">
            {preview}
          </span>
        )}

        {!isExpandable && (
          <span className="text-detail ml-1">{renderPrimitive(value)}</span>
        )}
      </div>

      {isExpandable && expanded && (
        <div>
          {entries.map(([k, v]) => (
            <StateNode
              key={k}
              keyName={k}
              value={v}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const StateTree = ({ data, searchQuery }: StateTreeProps) => {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-disabled text-detail">
        Empty state
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-2 font-mono">
      {entries.map(([key, value]) => (
        <StateNode
          key={key}
          keyName={key}
          value={value}
          depth={0}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
};
