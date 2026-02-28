import { useState, useMemo } from 'react';
import { colorValues } from '@radar/design-system';

type ParsedFrame = {
  functionName: string;
  fileName: string;
  line: number;
  column: number;
};

const parseStackTrace = (stack: string): ParsedFrame[] => {
  return stack
    .split('\n')
    .filter(line => line.trimStart().startsWith('at '))
    .map(line => {
      const trimmed = line.trim();
      // Pattern: "at functionName (file:line:col)"
      const withFn = trimmed.match(/^at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/);
      if (withFn) {
        return {
          functionName: withFn[1],
          fileName: withFn[2],
          line: Number(withFn[3]),
          column: Number(withFn[4]),
        };
      }
      // Pattern: "at file:line:col"
      const withoutFn = trimmed.match(/^at\s+(.+):(\d+):(\d+)$/);
      if (withoutFn) {
        return {
          functionName: '<anonymous>',
          fileName: withoutFn[1],
          line: Number(withoutFn[2]),
          column: Number(withoutFn[3]),
        };
      }
      return null;
    })
    .filter((frame): frame is ParsedFrame => frame !== null);
};

export type ErrorEntryProps = {
  message: string;
  stack?: string;
};

export const ErrorEntry = ({ message, stack }: ErrorEntryProps) => {
  const [expanded, setExpanded] = useState(false);
  const frames = useMemo(() => (stack ? parseStackTrace(stack) : []), [stack]);

  return (
    <span className="inline-flex flex-col">
      <span style={{ color: colorValues['status-error'] }}>
        Error: {message}
      </span>
      {frames.length > 0 && (
        <>
          <span
            onClick={() => setExpanded(prev => !prev)}
            className="cursor-pointer select-none text-detail"
            style={{ color: colorValues['text-tertiary'] }}
          >
            {expanded ? '▼' : '▶'} {expanded ? 'Hide' : 'Show'} stack trace (
            {frames.length} {frames.length === 1 ? 'frame' : 'frames'})
          </span>
          {expanded && (
            <span className="flex flex-col pl-2 pt-0.5 text-detail">
              {frames.map((frame, i) => (
                <span key={i}>
                  <span style={{ color: colorValues['text-primary'] }}>
                    {frame.functionName}
                  </span>
                  <span
                    style={{ color: colorValues['text-tertiary'] }}
                    className="hover:underline"
                  >
                    {' '}
                    {frame.fileName}:{frame.line}:{frame.column}
                  </span>
                </span>
              ))}
            </span>
          )}
        </>
      )}
    </span>
  );
};
