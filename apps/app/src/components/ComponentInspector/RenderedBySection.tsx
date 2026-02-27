import type { RenderedByEntry } from '@radar/types';
import { DetailSection } from '..';

export type RenderedBySectionProps = {
  renderedBy: RenderedByEntry[];
  onInspectComponent: (id: string) => void;
};

export const RenderedBySection = ({
  renderedBy,
  onInspectComponent,
}: RenderedBySectionProps) => (
  <DetailSection title="rendered by">
    {renderedBy.map((entry, index) => {
      const id = entry.id;
      return id !== undefined ? (
        <button
          key={id}
          onClick={() => onInspectComponent(id)}
          className="block bg-transparent border-none text-accent text-xs cursor-pointer py-0.5 px-0 hover:underline text-left"
        >
          {entry.name}
        </button>
      ) : (
        <span
          key={`root-${index}`}
          className="block text-text-secondary text-xs py-0.5"
        >
          {entry.name}
        </span>
      );
    })}
  </DetailSection>
);
