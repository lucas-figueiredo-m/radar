import type { ReactNode } from 'react';

interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

export const DetailSection = ({ title, children }: DetailSectionProps) => (
  <div className="mb-4">
    <div className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.5px] mb-2">
      {title}
    </div>
    <div className="bg-bg-inset rounded-lg p-2.5">{children}</div>
  </div>
);
