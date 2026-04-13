import type { McpContext, McpServerHandle, WebSocketHandle } from './src/types';

export declare const startMcpServer: (
  ctx: McpContext & { port?: number },
) => McpServerHandle;

export type { McpServerHandle, McpContext, WebSocketHandle };
