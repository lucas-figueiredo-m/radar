import { useCallback } from 'react';
import { toast } from 'sonner';
import { CopyButton, DetailSection } from '..';
import { openInEditor } from '../../services';

export type SourceFileSectionProps = {
  sourceFile: string;
  lineNumber?: number;
  editorName?: string | null;
  onRequestEditorPicker?: () => void;
};

export const SourceFileSection = ({
  sourceFile,
  lineNumber,
  editorName,
  onRequestEditorPicker,
}: SourceFileSectionProps) => {
  const label =
    lineNumber !== undefined ? `${sourceFile}:${lineNumber}` : sourceFile;

  const handleClick = useCallback(() => {
    if (!editorName && onRequestEditorPicker) {
      onRequestEditorPicker();
      return;
    }

    openInEditor(sourceFile, lineNumber).then(result => {
      if (!result.success) {
        console.error('[radar] Failed to open in editor:', result.error);
        toast.error(result.error ?? 'Failed to open file in editor');
      }
    });
  }, [sourceFile, lineNumber, editorName, onRequestEditorPicker]);

  const tooltip = editorName
    ? `Open in ${editorName}`
    : 'Click to select an editor';

  return (
    <DetailSection title="source file">
      <div className="group flex items-center gap-1.5">
        <span
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={e => e.key === 'Enter' && handleClick()}
          title={tooltip}
          className="text-xs text-accent cursor-pointer hover:underline"
        >
          {label}
        </span>
        <CopyButton text={label} ariaLabel="Copy source file path" />
      </div>
    </DetailSection>
  );
};
