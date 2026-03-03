export const formatArg = (arg: unknown): string => {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  if (
    typeof arg === 'object' &&
    arg !== null &&
    '__type' in (arg as Record<string, unknown>)
  ) {
    const marker = arg as Record<string, unknown>;
    switch (marker.__type) {
      case 'Error': {
        const err = marker as { message: string; stack?: string };
        return `Error: ${err.message}${err.stack ? '\n' + err.stack : ''}`;
      }
      case 'Function':
        return `ƒ ${marker.name as string}()`;
      case 'Symbol':
        return `Symbol(${marker.description as string})`;
      case 'BigInt':
        return marker.value as string;
      case 'Undefined':
        return 'undefined';
      case 'Circular': {
        const keys = marker.keys as string[] | undefined;
        const keysPreview =
          keys && keys.length > 0 ? `: {${keys.join(', ')}}` : '';
        return `[Circular${keysPreview}]`;
      }
      case 'ReactElement': {
        const props = marker.props as Record<string, unknown> | undefined;
        const hasProps = props && Object.keys(props).length > 0;
        return hasProps
          ? `<${marker.name as string} props={...} />`
          : `<${marker.name as string} />`;
      }
      case 'Object':
        return marker.preview as string;
      case 'Array':
        return `Array(${marker.length as number})`;
    }
  }
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return String(arg);
  }
};
