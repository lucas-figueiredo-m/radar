export const extractUrl = (input: string | URL | Request): string =>
  typeof input === 'string'
    ? input
    : input instanceof URL
    ? input.toString()
    : (input as { url: string }).url;
