import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

const DATA_TYPES = [
  'console',
  'network',
  'componentTree',
  'profiler',
  'performance',
  'storage',
  'state',
  'startup',
] as const;

type DataType = (typeof DATA_TYPES)[number];

export const registerResetData = (server: McpServer, ctx: McpContext): void => {
  server.tool(
    'reset_data',
    'Clear data from the Radar database. Useful when switching between apps or starting a fresh debugging session. Can clear specific data types or everything.',
    {
      types: z
        .array(
          z.enum([
            'console',
            'network',
            'componentTree',
            'profiler',
            'performance',
            'storage',
            'state',
            'startup',
            'all',
          ]),
        )
        .optional()
        .default(['all'])
        .describe('Data types to clear. Defaults to ["all"].'),
      deviceId: z
        .string()
        .optional()
        .describe(
          'Device ID to clear data for. Omit to clear data for all devices.',
        ),
    },
    async ({ types, deviceId }) => {
      const clearAll = types.includes('all');
      const typesToClear: DataType[] = clearAll
        ? [...DATA_TYPES]
        : types.filter((t): t is DataType => t !== 'all');

      const results: Record<string, number> = {};

      const clearFn = (type: DataType): number => {
        const repo = {
          console: ctx.db.console,
          network: ctx.db.network,
          componentTree: ctx.db.componentTree,
          profiler: ctx.db.profiler,
          performance: ctx.db.performance,
          storage: ctx.db.storage,
          state: ctx.db.state,
          startup: ctx.db.startup,
        }[type];

        if (deviceId) {
          const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
          return repo.clear(resolvedId);
        }
        return repo.clearAll();
      };

      for (const type of typesToClear) {
        results[type] = clearFn(type);
      }

      // Also clear inspected components when clearing component tree
      if (typesToClear.includes('componentTree')) {
        if (deviceId) {
          const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
          results.inspectedComponents =
            ctx.db.inspectedComponent.clear(resolvedId);
        } else {
          results.inspectedComponents = ctx.db.inspectedComponent.clearAll();
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                message: `Cleared ${typesToClear.join(', ')} data${
                  deviceId ? ` for device ${deviceId}` : ' for all devices'
                }.`,
                recordsCleared: results,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
};
