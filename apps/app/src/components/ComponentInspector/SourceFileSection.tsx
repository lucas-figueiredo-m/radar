import { DetailSection } from '..';

export type SourceFileSectionProps = {
  sourceFile: string;
  lineNumber?: number;
};

export const SourceFileSection = ({
  sourceFile,
  lineNumber,
}: SourceFileSectionProps) => {
  const label =
    lineNumber !== undefined ? `${sourceFile}:${lineNumber}` : sourceFile;

  return (
    <DetailSection title="source file">
      <span className="text-xs text-text-primary">{label}</span>
    </DetailSection>
  );
};
