'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, TerminalSquare } from 'lucide-react';
import { CodeBlock } from '../CodeBlock';

type Provider = {
  id: string;
  name: string;
  icon: string;
  command: string;
  config: string;
  configFile: string;
};

const PROVIDERS: Provider[] = [
  {
    id: 'claude',
    name: 'Claude',
    icon: 'C',
    command: 'claude mcp add radar --transport http http://localhost:8348/mcp',
    configFile: '.claude/settings.json',
    config: `{
  "mcpServers": {
    "radar": {
      "url": "http://localhost:8348/mcp"
    }
  }
}`,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: 'Cu',
    command: 'cursor mcp add radar http://localhost:8348/mcp',
    configFile: '.cursor/mcp.json',
    config: `{
  "mcpServers": {
    "radar": {
      "url": "http://localhost:8348/mcp"
    }
  }
}`,
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    icon: 'W',
    command: 'windsurf mcp add radar http://localhost:8348/mcp',
    configFile: '.windsurf/mcp.json',
    config: `{
  "mcpServers": {
    "radar": {
      "serverUrl": "http://localhost:8348/mcp"
    }
  }
}`,
  },
  {
    id: 'codex',
    name: 'Codex',
    icon: 'Cx',
    command: 'codex mcp add radar http://localhost:8348/mcp',
    configFile: 'codex.json',
    config: `{
  "mcpServers": {
    "radar": {
      "url": "http://localhost:8348/mcp"
    }
  }
}`,
  },
  {
    id: 'vscode',
    name: 'VS Code',
    icon: 'VS',
    command:
      'code --add-mcp \'{ "name": "radar", "type": "http", "url": "http://localhost:8348/mcp" }\'',
    configFile: '.vscode/mcp.json',
    config: `{
  "servers": {
    "radar": {
      "type": "http",
      "url": "http://localhost:8348/mcp"
    }
  }
}`,
  },
];

type CopiedField = 'command' | 'config' | null;

export const McpProviderSwitcher = () => {
  const [activeProvider, setActiveProvider] = useState(PROVIDERS[0]);
  const [copied, setCopied] = useState<CopiedField>(null);

  const handleCopy = useCallback((text: string, field: CopiedField) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const CopyButton = ({
    text,
    field,
  }: {
    text: string;
    field: CopiedField;
  }) => (
    <button
      type="button"
      onClick={() => handleCopy(text, field)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong transition-all duration-200 text-xs font-medium shrink-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      aria-label={copied === field ? 'Copied' : 'Copy'}
    >
      {copied === field ? (
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
  );

  return (
    <div>
      {/* Provider tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PROVIDERS.map(provider => (
          <button
            key={provider.id}
            type="button"
            onClick={() => {
              setActiveProvider(provider);
              setCopied(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeProvider.id === provider.id
                ? 'bg-accent text-white'
                : 'bg-bg-surface border border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong'
            }`}
          >
            <span className="font-mono text-xs font-bold opacity-60">
              {provider.icon}
            </span>
            {provider.name}
          </button>
        ))}
      </div>

      {/* CLI command */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TerminalSquare
            className="w-3.5 h-3.5 text-text-tertiary"
            aria-hidden="true"
          />
          <span className="text-text-tertiary text-xs font-medium uppercase tracking-wider">
            CLI
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border-default bg-bg-inset px-4 py-3">
          <code className="font-mono text-sm text-text-secondary flex-1 min-w-0 overflow-x-auto whitespace-nowrap">
            {activeProvider.command}
          </code>
          <CopyButton text={activeProvider.command} field="command" />
        </div>
      </div>

      {/* Config file */}
      <div>
        <p className="text-text-tertiary text-xs font-mono mb-2">
          {activeProvider.configFile}
        </p>
        <div className="relative group">
          <CodeBlock code={activeProvider.config} />
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <CopyButton text={activeProvider.config} field="config" />
          </div>
        </div>
      </div>
    </div>
  );
};
