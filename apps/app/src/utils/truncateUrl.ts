export const truncateUrl = (url: string): string => {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path.length > 60 ? path.slice(0, 60) + '...' : path;
  } catch {
    return url.length > 60 ? url.slice(0, 60) + '...' : url;
  }
};
