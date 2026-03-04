"use client";

type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
};

const TOKEN_PATTERNS: Array<{ pattern: RegExp; className: string }> = [
  { pattern: /\/\/.*$/gm, className: "text-text-tertiary" },
  { pattern: /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, className: "text-syntax-string" },
  { pattern: /\b(import|from|export|const|let|var|return|function|type|async|await)\b/g, className: "text-syntax-boolean" },
  { pattern: /\b\d+\b/g, className: "text-syntax-number" },
  { pattern: /[{}()\[\]]/g, className: "text-syntax-bracket" },
];

const highlightSyntax = (code: string): string => {
  const tokens: Array<{ start: number; end: number; className: string }> = [];

  for (const { pattern, className } of TOKEN_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(code)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = tokens.some((t) => start < t.end && end > t.start);
      if (!overlaps) {
        tokens.push({ start, end, className });
      }
    }
  }

  tokens.sort((a, b) => a.start - b.start);

  let result = "";
  let cursor = 0;
  for (const token of tokens) {
    if (token.start > cursor) {
      result += escapeHtml(code.slice(cursor, token.start));
    }
    result += `<span class="${token.className}">${escapeHtml(code.slice(token.start, token.end))}</span>`;
    cursor = token.end;
  }
  if (cursor < code.length) {
    result += escapeHtml(code.slice(cursor));
  }

  return result;
};

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const CodeBlock = ({ code, className = "" }: CodeBlockProps) => {
  return (
    <div className={`rounded-xl border border-border-default bg-bg-inset overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <div className="w-3 h-3 rounded-full bg-status-error/60" />
        <div className="w-3 h-3 rounded-full bg-status-warning/60" />
        <div className="w-3 h-3 rounded-full bg-status-success/60" />
      </div>
      <pre className="p-4 overflow-x-auto">
        <code
          className="font-mono text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightSyntax(code) }}
        />
      </pre>
    </div>
  );
};
