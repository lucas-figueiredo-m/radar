import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerModifyStorage = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'modify_storage',
    'Modify storage on the connected device: set a key-value pair, remove a key, or clear all entries for a backend. Changes are sent to the device and applied in real-time.',
    {
      action: z
        .enum(['set', 'remove', 'clear'])
        .describe(
          '"set" to add/update, "remove" to delete a key, "clear" to wipe all entries',
        ),
      backend: z
        .enum(['asyncStorage', 'mmkv'])
        .describe('Storage backend to modify'),
      instanceId: z
        .string()
        .optional()
        .describe('MMKV instance ID (for multi-instance MMKV setups)'),
      key: z
        .string()
        .optional()
        .describe('Storage key (required for "set" and "remove" actions)'),
      value: z
        .string()
        .optional()
        .describe('Value to set (required for "set" action)'),
      valueType: z
        .enum(['string', 'number', 'boolean'])
        .optional()
        .default('string')
        .describe('Value type (default "string")'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({
      action,
      backend,
      instanceId,
      key,
      value,
      valueType,
      deviceId,
    }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
      const requestId = crypto.randomUUID();

      if (action === 'set') {
        if (!key || value === undefined) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '"key" and "value" are required for the "set" action.',
              },
            ],
            isError: true,
          };
        }
        ctx.wsHandle.sendToDevice(
          resolvedId,
          JSON.stringify({
            type: 'storageSet',
            requestId,
            backend,
            instanceId,
            key,
            value,
            valueType,
          }),
        );
        return {
          content: [
            {
              type: 'text' as const,
              text: `Set "${key}" = "${value}" (${valueType}) on ${backend}${
                instanceId ? ` [${instanceId}]` : ''
              }.`,
            },
          ],
        };
      }

      if (action === 'remove') {
        if (!key) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '"key" is required for the "remove" action.',
              },
            ],
            isError: true,
          };
        }
        ctx.wsHandle.sendToDevice(
          resolvedId,
          JSON.stringify({
            type: 'storageRemove',
            requestId,
            backend,
            instanceId,
            key,
          }),
        );
        return {
          content: [
            {
              type: 'text' as const,
              text: `Removed "${key}" from ${backend}${
                instanceId ? ` [${instanceId}]` : ''
              }.`,
            },
          ],
        };
      }

      // clear
      ctx.wsHandle.sendToDevice(
        resolvedId,
        JSON.stringify({
          type: 'storageClear',
          requestId,
          backend,
          instanceId,
        }),
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: `Cleared all entries from ${backend}${
              instanceId ? ` [${instanceId}]` : ''
            }.`,
          },
        ],
      };
    },
  );
};
