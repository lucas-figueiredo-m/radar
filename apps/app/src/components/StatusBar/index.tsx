import { ChevronDown } from 'lucide-react';
import { EditorPicker } from './EditorPicker';

type EditorOption = {
  id: string;
  name: string;
};

export type StatusBarProps = {
  label: string;
  editors: EditorOption[];
  preferredEditor: string | null;
  onEditorChange: (id: string) => void;
  pickerOpen: boolean;
  onTogglePicker: () => void;
  onClosePicker: () => void;
};

export const StatusBar = ({
  label,
  editors,
  preferredEditor,
  onEditorChange,
  pickerOpen,
  onTogglePicker,
  onClosePicker,
}: StatusBarProps) => {
  const editorName = editors.find(e => e.id === preferredEditor)?.name ?? null;

  return (
    <div className="px-4 py-1.5 border-t border-border-default text-[11px] text-text-tertiary shrink-0 flex justify-between items-center">
      <span>{label}</span>

      <div className="flex items-center gap-3">
        {editors.length > 0 && (
          <div className="relative">
            <button
              onClick={onTogglePicker}
              className="flex items-center gap-1 hover:text-text-secondary cursor-pointer transition-colors"
            >
              <span>{editorName ?? 'Select editor'}</span>
              <ChevronDown size={12} />
            </button>

            {pickerOpen && (
              <EditorPicker
                editors={editors}
                preferred={preferredEditor}
                onSelect={onEditorChange}
                onClose={onClosePicker}
              />
            )}
          </div>
        )}

        <span>ws://localhost:8347</span>
      </div>
    </div>
  );
};

export { EditorPicker } from './EditorPicker';
export type { EditorPickerProps } from './EditorPicker';
