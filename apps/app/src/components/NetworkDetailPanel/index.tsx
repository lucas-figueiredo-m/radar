import { useMemo } from 'react';

import { CopyButton } from '../CopyButton';
import { DetailRow } from '../DetailRow';
import { DetailSection } from '../DetailSection';
import { ValueRenderer } from '../ValueRenderer';
import { formatTime, formatDuration } from '../../utils';
import { METHOD_COLORS } from '../../utils/methodColors';
import { statusColor } from '../../utils/statusColor';
import type { NetworkEntry } from '../../types';

type NetworkDetailPanelProps = {
  request: NetworkEntry;
  onClose: () => void;
};

const stringifyBody = (body: unknown): string =>
  typeof body === 'string' ? body : JSON.stringify(body, null, 2);

const parseQueryParams = (url: string): Array<[string, string]> => {
  try {
    const searchParams = new URL(url).searchParams;
    return Array.from(searchParams.entries());
  } catch {
    return [];
  }
};

const getGraphQLQuery = (body: unknown): string | null => {
  if (typeof body === 'object' && body !== null && 'query' in body) {
    const { query } = body as { query: string };
    return typeof query === 'string' ? query : null;
  }
  return null;
};

export const NetworkDetailPanel = ({
  request,
  onClose,
}: NetworkDetailPanelProps) => {
  const queryParams = useMemo(
    () => parseQueryParams(request.url),
    [request.url],
  );
  const graphqlQuery = useMemo(
    () => (request.graphql ? getGraphQLQuery(request.requestBody) : null),
    [request.graphql, request.requestBody],
  );

  const methodLabel = request.graphql
    ? request.graphql.operationType.toUpperCase()
    : request.method;
  const methodColor = METHOD_COLORS[methodLabel] ?? METHOD_COLORS['GET'];

  const statusText = request.status
    ? `${request.status} ${request.statusText ?? ''}`
    : request.pending
      ? 'Pending...'
      : 'Failed';

  const statusStyle = request.status
    ? statusColor(request.status)
    : request.pending
      ? undefined
      : statusColor(0);

  return (
    <div className="w-[var(--detail-panel-width)] overflow-auto p-4 shrink-0">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold">Request Detail</span>
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-none text-text-tertiary cursor-pointer text-base hover:text-text-primary transition-colors"
        >
          &#x2715;
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
          style={{ color: methodColor, backgroundColor: `${methodColor}1A` }}
        >
          {methodLabel}
        </span>
        {request.graphql && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-text-secondary bg-bg-surface">
            GQL
          </span>
        )}
        <span
          className="text-xs font-semibold"
          style={statusStyle ? { color: statusStyle } : undefined}
        >
          {statusText}
        </span>
        {request.duration !== undefined && (
          <span className="text-xs text-text-tertiary">
            {formatDuration(request.duration)}
          </span>
        )}
      </div>

      {/* URL */}
      <DetailSection title="URL" copyText={request.url}>
        <span className="text-xs text-text-primary break-all">
          {request.url}
        </span>
        {queryParams.length > 0 && (
          <div className="mt-2 border-t border-border-subtle pt-2">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.5px] mb-1 block">
              Query Parameters
            </span>
            {queryParams.map(([key, value], i) => (
              <DetailRow key={`${key}-${i}`} label={key} value={value} />
            ))}
          </div>
        )}
      </DetailSection>

      {/* General */}
      <DetailSection title="General">
        <DetailRow label="Method" value={request.method} />
        <DetailRow
          label="Protocol"
          value={request.graphql ? 'GraphQL' : 'HTTP'}
        />
        {request.graphql?.operationName && (
          <DetailRow
            label="Operation Name"
            value={request.graphql.operationName}
          />
        )}
        <DetailRow label="Time" value={formatTime(request.timestamp)} />
      </DetailSection>

      {/* GraphQL Query */}
      {graphqlQuery && (
        <DetailSection title="GraphQL Query" copyText={graphqlQuery}>
          <pre className="m-0 whitespace-pre-wrap break-all text-text-primary text-xs leading-relaxed font-mono">
            {graphqlQuery}
          </pre>
        </DetailSection>
      )}

      {/* Request Headers */}
      {request.requestHeaders &&
        Object.keys(request.requestHeaders).length > 0 && (
          <DetailSection title="Request Headers" collapsible defaultCollapsed>
            {Object.entries(request.requestHeaders).map(([k, v]) => (
              <DetailRow key={k} label={k} value={v} />
            ))}
          </DetailSection>
        )}

      {/* Request Body */}
      {request.requestBody !== undefined && (
        <DetailSection
          title="Request Body"
          copyText={stringifyBody(request.requestBody)}
        >
          <ValueRenderer value={request.requestBody} inline={false} />
        </DetailSection>
      )}

      {/* Response Headers */}
      {request.responseHeaders &&
        Object.keys(request.responseHeaders).length > 0 && (
          <DetailSection title="Response Headers" collapsible defaultCollapsed>
            {Object.entries(request.responseHeaders).map(([k, v]) => (
              <DetailRow key={k} label={k} value={v} />
            ))}
          </DetailSection>
        )}

      {/* Response Body */}
      {request.responseBody !== undefined && (
        <DetailSection
          title="Response Body"
          copyText={stringifyBody(request.responseBody)}
        >
          <ValueRenderer value={request.responseBody} inline={false} />
        </DetailSection>
      )}
    </div>
  );
};
