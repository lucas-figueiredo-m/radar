import type { InspectedComponentData } from '@radar/types';
import { DetailSection } from '..';

export type SourceSectionProps = {
  source: NonNullable<InspectedComponentData['source']>;
};

export const SourceSection = ({ source }: SourceSectionProps) => {
  const label =
    source.lineNumber !== undefined
      ? `${source.fileName}:${source.lineNumber}`
      : source.fileName;

  return (
    <DetailSection title="source">
      <span className="text-xs text-text-primary break-all">{label}</span>
    </DetailSection>
  );
};
