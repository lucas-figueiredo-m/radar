import { DetailSection } from '..';

export type SourceFileSectionProps = {
  sourceFile: string;
};

export const SourceFileSection = ({ sourceFile }: SourceFileSectionProps) => (
  <DetailSection title="source file">
    <span className="text-xs text-text-primary">{sourceFile}</span>
  </DetailSection>
);
