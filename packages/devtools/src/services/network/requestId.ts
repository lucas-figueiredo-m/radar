let requestIdCounter = 0;

export const generateRequestId = (): string => `req_${requestIdCounter++}`;
