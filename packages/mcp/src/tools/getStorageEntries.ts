import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerGetStorageEntries = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_storage_entries',
    'List storage entries from AsyncStorage or MMKV on the connected device. Returns available backends and their key-value entries.',
    {
      backend: z
        .enum(['asyncStorage', 'mmkv'])
        .optional()
        .describe(
          'Storage backend to query. Omit to get capabilities and entries from the first available backend.',
        ),
      instanceId: z
        .string()
        .optional()
        .describe('MMKV instance ID (for multi-instance MMKV setups)'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ backend, instanceId, deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
      const capabilities = ctx.db.storage.getCapabilities(resolvedId);

      const availableBackends = capabilities.map((c) => ({
        backend: c.backend,
        available: c.available === 1,
        instanceId: c.instance_id,
      }));

      const selectedBackend =
        backend ??
        capabilities.find((c) => c.available === 1)?.backend ??
        null;

      if (!selectedBackend) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  availableBackends,
                  entries: [],
                  message: 'No storage backends available.',
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const entries = ctx.db.storage.getEntries({
        device_id: resolvedId,
        backend: selectedBackend,
        instance_id: instanceId,
      });

      const parsed = entries.map((e) => ({
        key: e.key,
        value: e.value,
        valueType: e.value_type,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                availableBackends,
                backend: selectedBackend,
                instanceId: instanceId ?? null,
                entryCount: parsed.length,
                entries: parsed,
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
