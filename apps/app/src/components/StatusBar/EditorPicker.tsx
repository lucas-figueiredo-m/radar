import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

type EditorOption = {
  id: string;
  name: string;
};

export type EditorPickerProps = {
  editors: EditorOption[];
  preferred: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export const EditorPicker = ({
  editors,
  preferred,
  onSelect,
  onClose,
}: EditorPickerProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-1 right-0 bg-bg-elevated border border-border-default rounded-md shadow-lg py-1 min-w-[160px] z-50"
    >
      <div className="px-3 py-1.5 text-[10px] uppercase text-text-tertiary font-semibold tracking-wider">
        Open files with
      </div>
      {editors.map(editor => (
        <button
          key={editor.id}
          onClick={() => {
            onSelect(editor.id);
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-bg-surface cursor-pointer text-left"
        >
          <span className="w-3.5 shrink-0">
            {editor.id === preferred && (
              <Check size={12} className="text-accent" />
            )}
          </span>
          <span
            className={
              editor.id === preferred
                ? 'text-text-primary'
                : 'text-text-secondary'
            }
          >
            {editor.name}
          </span>
        </button>
      ))}
    </div>
  );
};
