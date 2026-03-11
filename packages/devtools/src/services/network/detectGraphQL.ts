import type { GraphQLInfo } from '@radar/types';

export const detectGraphQL = (body: unknown): GraphQLInfo | undefined => {
  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    !('query' in body)
  ) {
    return undefined;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.query !== 'string') {
    return undefined;
  }

  const trimmed = record.query.trimStart();
  const operationType: GraphQLInfo['operationType'] = trimmed.startsWith(
    'mutation',
  )
    ? 'mutation'
    : 'query';

  const operationName =
    typeof record.operationName === 'string' ? record.operationName : undefined;

  return { operationType, operationName };
};
