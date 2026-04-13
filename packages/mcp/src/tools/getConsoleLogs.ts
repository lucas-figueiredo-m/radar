import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerGetConsoleLogs = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_console_logs',
    'Query console logs captured from the React Native app. Supports filtering by log level (log, warn, error, debug) and pagination.',
    {
      level: z
        .enum(['log', 'warn', 'error', 'debug'])
        .optional()
        .describe('Filter by log level'),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe('Max number of logs to return (default 50)'),
      offset: z.number().optional().default(0).describe('Offset for pagination'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ level, limit, offset, deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
      const logs = ctx.db.console.query({
        device_id: resolvedId,
        level,
        limit,
        offset,
      });
      const total = ctx.db.console.count({
        device_id: resolvedId,
        level,
      });

      const parsed = logs.map((log) => ({
        id: log.id,
        level: log.level,
        args: JSON.parse(log.args),
        timestamp: log.timestamp,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ total, logs: parsed }, null, 2),
          },
        ],
      };
    },
  );
};
