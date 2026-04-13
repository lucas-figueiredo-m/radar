import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  registerGetAppOverview,
  registerGetConsoleLogs,
  registerGetNetworkRequests,
  registerGetNetworkRequestDetail,
  registerGetComponentTree,
  registerInspectComponent,
  registerGetProfilerData,
  registerGetPerformanceMetrics,
  registerGetStartupMetrics,
  registerGetStorageEntries,
  registerModifyStorage,
  registerGetStateSnapshot,
  registerGetStateActions,
  registerStartProfiling,
  registerStopProfiling,
  registerReloadAndProfile,
  registerRefreshState,
  registerResetData,
} from './tools';
import type { McpContext } from './types';

export const createMcpServer = (ctx: McpContext): McpServer => {
  const server = new McpServer({
    name: 'Radar DevTools',
    version: '0.1.0',
  });

  registerGetAppOverview(server, ctx);
  registerGetConsoleLogs(server, ctx);
  registerGetNetworkRequests(server, ctx);
  registerGetNetworkRequestDetail(server, ctx);
  registerGetComponentTree(server, ctx);
  registerInspectComponent(server, ctx);
  registerGetProfilerData(server, ctx);
  registerGetPerformanceMetrics(server, ctx);
  registerGetStartupMetrics(server, ctx);
  registerGetStorageEntries(server, ctx);
  registerModifyStorage(server, ctx);
  registerGetStateSnapshot(server, ctx);
  registerGetStateActions(server, ctx);
  registerStartProfiling(server, ctx);
  registerStopProfiling(server, ctx);
  registerReloadAndProfile(server, ctx);
  registerRefreshState(server, ctx);
  registerResetData(server, ctx);

  return server;
};
