import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

export type CopyButtonProps = {
  text: string;
};

export const CopyButton = ({ text }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-bg-elevated cursor-pointer"
      aria-label="Copy log entry"
    >
      {copied ? (
        <>
          <Check size={14} className="text-status-success" />
          <span className="text-[11px] text-status-success">Copied</span>
        </>
      ) : (
        <>
          <Copy size={14} className="text-text-tertiary" />
          <span className="text-[11px] text-text-tertiary">Copy</span>
        </>
      )}
    </button>
  );
};
