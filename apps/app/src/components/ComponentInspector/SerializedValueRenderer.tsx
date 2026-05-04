import { useState } from 'react';
import type { SerializedValue } from '@radar/types';
import { SYNTAX_COLORS } from '../ValueRenderer/constants';

export type SerializedValueRendererProps = {
  value: SerializedValue;
};

export const SerializedValueRenderer = ({
  value,
}: SerializedValueRendererProps) => {
  const [expanded, setExpanded] = useState(false);

  switch (value.type) {
    case 'primitive': {
      if (value.value === null) {
        return <span style={{ color: SYNTAX_COLORS.null }}>null</span>;
      }
      if (value.value === undefined) {
        return (
          <span style={{ color: SYNTAX_COLORS.undefined }}>undefined</span>
        );
      }
      if (typeof value.value === 'boolean') {
        return (
          <span style={{ color: SYNTAX_COLORS.boolean }}>
            {value.value ? 'true' : 'false'}
          </span>
        );
      }
      return (
        <span style={{ color: SYNTAX_COLORS.number }}>
          {String(value.value)}
        </span>
      );
    }

    case 'string': {
      const isHexColor = /^#(?:[0-9a-fA-F]{3,4}){1,2}$/.test(value.value);
      return (
        <span className="inline-flex items-center gap-1">
          <span style={{ color: SYNTAX_COLORS.string }}>
            &quot;{value.value}&quot;{value.truncated && '\u2026'}
          </span>
          {isHexColor && (
            <span
              className="inline-block w-3 h-3 rounded-sm border border-border-subtle shrink-0"
              style={{ backgroundColor: value.value }}
            />
          )}
        </span>
      );
    }

    case 'function': {
      return (
        <span style={{ color: SYNTAX_COLORS.function }}>
          {'\u0192'} {value.name}()
        </span>
      );
    }

    case 'symbol': {
      return (
        <span style={{ color: SYNTAX_COLORS.symbol }}>
          Symbol({value.description})
        </span>
      );
    }

    case 'element': {
      return (
        <span style={{ color: SYNTAX_COLORS.function }}>
          &lt;{value.elementType} /&gt;
        </span>
      );
    }

    case 'circular': {
      return <span style={{ color: SYNTAX_COLORS.null }}>[Circular]</span>;
    }

    case 'unknown': {
      return <span style={{ color: SYNTAX_COLORS.null }}>{value.preview}</span>;
    }

    case 'array': {
      if (value.dehydrated || !value.items) {
        return (
          <span className="text-text-tertiary">Array({value.length})</span>
        );
      }

      if (!expanded) {
        return (
          <span
            className="cursor-pointer hover:opacity-80"
            onClick={() => setExpanded(true)}
          >
            <span style={{ color: SYNTAX_COLORS.bracket }}>[{'\u2026'}]</span>{' '}
            <span className="text-text-tertiary">({value.length})</span>
          </span>
        );
      }

      return (
        <div className="flex flex-col">
          <span
            className="cursor-pointer select-none"
            onClick={() => setExpanded(false)}
          >
            <span style={{ color: SYNTAX_COLORS.bracket }}>{'[ '}</span>
            <span className="text-detail text-text-tertiary">
              {'\u25BC'} {value.length} {value.length === 1 ? 'item' : 'items'}
            </span>
          </span>
          <div className="flex flex-col pl-[2ch]">
            {value.items.map((item, i) => (
              <div key={i}>
                <span className="text-text-tertiary">{i}</span>
                <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
                <SerializedValueRenderer value={item} />
              </div>
            ))}
          </div>
          <span style={{ color: SYNTAX_COLORS.bracket }}>]</span>
        </div>
      );
    }

    case 'object': {
      if (value.dehydrated || !value.entries) {
        return <span className="text-text-tertiary">{value.preview}</span>;
      }

      if (!expanded) {
        return (
          <span
            className="cursor-pointer hover:opacity-80"
            onClick={() => setExpanded(true)}
          >
            <span style={{ color: SYNTAX_COLORS.bracket }}>
              {'{'}
              {'\u2026'}
              {'}'}
            </span>{' '}
            <span className="text-text-tertiary">{value.preview}</span>
          </span>
        );
      }

      return (
        <div className="flex flex-col">
          <span
            className="cursor-pointer select-none"
            onClick={() => setExpanded(false)}
          >
            <span style={{ color: SYNTAX_COLORS.bracket }}>{'{ '}</span>
            <span className="text-detail text-text-tertiary">
              {'\u25BC'} {value.entries.length}{' '}
              {value.entries.length === 1 ? 'key' : 'keys'}
            </span>
          </span>
          <div className="flex flex-col pl-[2ch]">
            {value.entries.map(entry => (
              <div key={entry.key}>
                <span style={{ color: SYNTAX_COLORS.key }}>{entry.key}</span>
                <span style={{ color: SYNTAX_COLORS.bracket }}>: </span>
                <SerializedValueRenderer value={entry.value} />
              </div>
            ))}
          </div>
          <span style={{ color: SYNTAX_COLORS.bracket }}>{'}'}</span>
        </div>
      );
    }
  }
};
