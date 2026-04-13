import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetComponentTree = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_component_tree',
    'Get the latest React component tree hierarchy from the connected app. Returns a tree of components with id, name, key, source file, and children. Use inspect_component to get detailed props and hooks for a specific component.',
    {
      deviceId: z
        .string()
        .optional()
        .describe(
          'Device ID to filter by. Omit to get the latest tree from any device.',
        ),
    },
    async ({ deviceId }) => {
      const tree = ctx.db.componentTree.getLatest(deviceId);

      if (!tree) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No component tree data available. Make sure the app is running and connected.',
            },
          ],
        };
      }

      const result = {
        deviceId: tree.device_id,
        rootNodes: JSON.parse(tree.root_nodes),
        timestamp: tree.timestamp,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
};
