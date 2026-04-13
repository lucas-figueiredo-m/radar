'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

type PackageManager = {
  id: string;
  name: string;
  command: string;
};

const PACKAGE_MANAGERS: PackageManager[] = [
  { id: 'npm', name: 'npm', command: 'npm install --save-dev radar-devtools' },
  { id: 'yarn', name: 'yarn', command: 'yarn add --dev radar-devtools' },
  { id: 'pnpm', name: 'pnpm', command: 'pnpm add -D radar-devtools' },
  { id: 'bun', name: 'bun', command: 'bun add -d radar-devtools' },
];

export const PackageManagerSwitcher = () => {
  const [active, setActive] = useState(PACKAGE_MANAGERS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(active.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [active]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {PACKAGE_MANAGERS.map(pm => (
          <button
            key={pm.id}
            type="button"
            onClick={() => {
              setActive(pm);
              setCopied(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all duration-200 ${
              active.id === pm.id
                ? 'bg-accent text-white'
                : 'bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong'
            }`}
          >
            {pm.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-inset px-4 py-3">
        <code className="font-mono text-sm text-text-secondary flex-1 min-w-0">
          {active.command}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong transition-all duration-200 text-xs font-medium shrink-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          aria-label={copied ? 'Copied' : 'Copy command'}
        >
          {copied ? (
            <>
              <Check
                className="w-3.5 h-3.5 text-status-success"
                aria-hidden="true"
              />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};
