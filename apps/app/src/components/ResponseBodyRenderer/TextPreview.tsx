type TextPreviewProps = {
  text: string;
  language?: string;
};

export const TextPreview = ({ text, language }: TextPreviewProps) => (
  <div className="relative">
    {language && (
      <span className="absolute top-1 right-1 text-[10px] uppercase font-bold text-text-tertiary bg-bg-surface px-1.5 py-0.5 rounded">
        {language}
      </span>
    )}
    <pre className="m-0 whitespace-pre-wrap break-all text-text-primary text-xs leading-relaxed font-mono overflow-auto max-h-96">
      {text}
    </pre>
  </div>
);
