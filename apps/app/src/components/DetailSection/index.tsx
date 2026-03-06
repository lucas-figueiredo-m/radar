import { type ReactNode, useState } from 'react';

import { CopyButton } from '../CopyButton';

type DetailSectionProps = {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  copyText?: string;
};

export const DetailSection = ({
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
  copyText,
}: DetailSectionProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={collapsible ? () => setCollapsed(c => !c) : undefined}
          className={`text-detail font-bold text-text-secondary uppercase tracking-[0.5px] bg-transparent border-none p-0 flex items-center gap-1 ${
            collapsible
              ? 'cursor-pointer hover:text-text-primary'
              : 'cursor-default'
          }`}
        >
          {collapsible && (
            <span className="text-[8px] inline-block w-3">
              {collapsed ? '▶' : '▼'}
            </span>
          )}
          {title}
        </button>
        {copyText && <CopyButton text={copyText} ariaLabel={`Copy ${title}`} />}
      </div>
      {!collapsed && (
        <div className="bg-bg-inset rounded-lg p-2.5">{children}</div>
      )}
    </div>
  );
};
