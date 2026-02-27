import { DetailSection, DetailRow } from '..';
import { formatTime, formatDuration } from '../../utils';
import type { NetworkEntry } from '../../types';

type NetworkDetailPanelProps = {
  request: NetworkEntry;
  onClose: () => void;
};

export const NetworkDetailPanel = ({ request, onClose }: NetworkDetailPanelProps) => (
  <div className="w-[var(--detail-panel-width)] overflow-auto p-4 shrink-0">
    <div className="flex justify-between items-center mb-4">
      <span className="text-sm font-semibold">Request Detail</span>
      <button
        onClick={onClose}
        className="bg-transparent border-none text-text-tertiary cursor-pointer text-base hover:text-text-primary transition-colors"
      >
        &#x2715;
      </button>
    </div>

    <DetailSection title="General">
      <DetailRow label="URL" value={request.url} />
      <DetailRow label="Method" value={request.method} />
      <DetailRow
        label="Status"
        value={
          request.status
            ? `${request.status} ${request.statusText ?? ''}`
            : request.pending
              ? 'Pending...'
              : 'Failed'
        }
      />
      <DetailRow label="Duration" value={formatDuration(request.duration)} />
      <DetailRow label="Time" value={formatTime(request.timestamp)} />
    </DetailSection>

    {request.requestHeaders && Object.keys(request.requestHeaders).length > 0 && (
      <DetailSection title="Request Headers">
        {Object.entries(request.requestHeaders).map(([k, v]) => (
          <DetailRow key={k} label={k} value={v} />
        ))}
      </DetailSection>
    )}

    {request.requestBody !== undefined && (
      <DetailSection title="Request Body">
        <pre className="m-0 whitespace-pre-wrap break-all text-text-primary text-xs leading-relaxed font-mono">
          {typeof request.requestBody === 'string'
            ? request.requestBody
            : JSON.stringify(request.requestBody, null, 2)}
        </pre>
      </DetailSection>
    )}

    {request.responseHeaders && Object.keys(request.responseHeaders).length > 0 && (
      <DetailSection title="Response Headers">
        {Object.entries(request.responseHeaders).map(([k, v]) => (
          <DetailRow key={k} label={k} value={v} />
        ))}
      </DetailSection>
    )}

    {request.responseBody !== undefined && (
      <DetailSection title="Response Body">
        <pre className="m-0 whitespace-pre-wrap break-all text-text-primary text-xs leading-relaxed font-mono">
          {typeof request.responseBody === 'string'
            ? request.responseBody
            : JSON.stringify(request.responseBody, null, 2)}
        </pre>
      </DetailSection>
    )}
  </div>
);
