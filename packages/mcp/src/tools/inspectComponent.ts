import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const registerInspectComponent = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'inspect_component',
    'Get detailed information about a specific React component: props, hooks, source file location, and rendered-by chain. Sends an inspect command to the device and returns the result.',
    {
      componentId: z
        .string()
        .describe(
          'The component ID from the component tree (get_component_tree)',
        ),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ componentId, deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);

      // Check if we already have inspection data
      const existing = ctx.db.inspectedComponent.getByComponentId(
        resolvedId,
        componentId,
      );

      if (existing) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(JSON.parse(existing.data), null, 2),
            },
          ],
        };
      }

      // Send inspect command to device
      ctx.wsHandle.sendToDevice(
        resolvedId,
        JSON.stringify({
          type: 'inspectComponent',
          direction: 'request',
          componentId,
        }),
      );

      // Poll for response with timeout
      const maxWait = 3000;
      const pollInterval = 100;
      let elapsed = 0;

      while (elapsed < maxWait) {
        await sleep(pollInterval);
        elapsed += pollInterval;

        const result = ctx.db.inspectedComponent.getByComponentId(
          resolvedId,
          componentId,
        );
        if (result) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(JSON.parse(result.data), null, 2),
              },
            ],
          };
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Timed out waiting for component inspection data. The component may no longer exist in the tree.`,
          },
        ],
        isError: true,
      };
    },
  );
};
