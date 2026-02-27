import type { InspectedComponentData } from '@radar/types';
import { PropsSection } from './PropsSection';
import { HooksSection } from './HooksSection';
import { RenderedBySection } from './RenderedBySection';
import { SourceFileSection } from './SourceFileSection';

export type ComponentInspectorProps = {
  data: InspectedComponentData;
  onClose: () => void;
  onInspectComponent: (id: string) => void;
};

export const ComponentInspector = ({
  data,
  onClose,
  onInspectComponent,
}: ComponentInspectorProps) => {
  const renderedBy = data.renderedBy ?? [];

  return (
    <div className="w-[var(--detail-panel-width)] overflow-auto p-4 shrink-0">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-accent">{data.name}</span>
        <button
          onClick={onClose}
          className="bg-transparent border-none text-text-tertiary cursor-pointer text-base hover:text-text-primary transition-colors"
        >
          &#x2715;
        </button>
      </div>

      {data.props.length > 0 && <PropsSection props={data.props} />}
      {data.hooks.length > 0 && <HooksSection hooks={data.hooks} />}
      {renderedBy.length > 0 && (
        <RenderedBySection
          renderedBy={renderedBy}
          onInspectComponent={onInspectComponent}
        />
      )}
      {data.sourceFile !== undefined && (
        <SourceFileSection
          sourceFile={data.sourceFile}
          lineNumber={data.source?.lineNumber}
        />
      )}

      {data.props.length === 0 &&
        data.hooks.length === 0 &&
        renderedBy.length === 0 &&
        data.sourceFile === undefined && (
          <div className="text-text-tertiary text-xs">No props or hooks</div>
        )}
    </div>
  );
};

export { SerializedValueRenderer } from './SerializedValueRenderer';
export type { SerializedValueRendererProps } from './SerializedValueRenderer';
export { PropsSection } from './PropsSection';
export type { PropsSectionProps } from './PropsSection';
export { HooksSection } from './HooksSection';
export type { HooksSectionProps } from './HooksSection';
export { RenderedBySection } from './RenderedBySection';
export type { RenderedBySectionProps } from './RenderedBySection';
export { SourceFileSection } from './SourceFileSection';
export type { SourceFileSectionProps } from './SourceFileSection';
