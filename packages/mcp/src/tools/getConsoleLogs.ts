import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { fenceUntrusted } from './fenceUntrusted';
import { UNTRUSTED_DATA_WARNING } from './untrustedDataWarning';

export const registerGetConsoleLogs = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_console_logs',
    'Query console logs captured from the React Native app. Supports filtering by log level (log, warn, error, debug) and pagination. Without deviceId, returns logs from all devices.',
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
      offset: z
        .number()
        .optional()
        .default(0)
        .describe('Offset for pagination'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID to filter by. Omit to get logs from all devices.'),
    },
    async ({ level, limit, offset, deviceId }) => {
      const logs = ctx.db.console.query({
        device_id: deviceId,
        level,
        limit,
        offset,
      });
      const total = ctx.db.console.count({
        device_id: deviceId,
        level,
      });

      const parsed = logs.map(log => ({
        id: log.id,
        deviceId: log.device_id,
        level: log.level,
        args: fenceUntrusted(
          JSON.parse(log.args),
          `console.logs[${log.id}].args`,
        ),
        timestamp: log.timestamp,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: `${UNTRUSTED_DATA_WARNING}\n${JSON.stringify(
              { total, logs: parsed },
              null,
              2,
            )}`,
          },
        ],
      };
    },
  );
};
