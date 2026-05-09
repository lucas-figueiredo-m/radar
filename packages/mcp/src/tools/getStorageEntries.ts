import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { fenceUntrusted } from './fenceUntrusted';
import { UNTRUSTED_DATA_WARNING } from './untrustedDataWarning';

export const registerGetStorageEntries = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_storage_entries',
    'List storage entries from AsyncStorage or MMKV on the connected device. Returns available backends and their key-value entries. Without deviceId, returns entries from all devices.',
    {
      backend: z
        .enum(['asyncStorage', 'mmkv'])
        .optional()
        .describe(
          'Storage backend to query. Omit to get the first available backend.',
        ),
      instanceId: z
        .string()
        .optional()
        .describe('MMKV instance ID (for multi-instance MMKV setups)'),
      deviceId: z
        .string()
        .optional()
        .describe(
          'Device ID to filter by. Omit to get entries from all devices.',
        ),
    },
    async ({ backend, instanceId, deviceId }) => {
      const capabilities = ctx.db.storage.getCapabilities(deviceId);

      const availableBackends = capabilities.map(c => ({
        deviceId: c.device_id,
        backend: c.backend,
        available: c.available === 1,
        instanceId: c.instance_id,
      }));

      const selectedBackend =
        backend ?? capabilities.find(c => c.available === 1)?.backend ?? null;

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
        device_id: deviceId,
        backend: selectedBackend,
        instance_id: instanceId,
      });

      const parsed = entries.map(e => ({
        deviceId: e.device_id,
        key: fenceUntrusted(e.key, `storage.${selectedBackend}.entry.key`),
        value: fenceUntrusted(
          e.value,
          `storage.${selectedBackend}.entry.value`,
        ),
        valueType: e.value_type,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: `${UNTRUSTED_DATA_WARNING}\n${JSON.stringify(
              {
                availableBackends,
                backend: selectedBackend,
                instanceId: instanceId ?? null,
                entryCount: parsed.length,
                entries: parsed,
              },
              null,
              2,
            )}`,
          },
        ],
      };
    },
  );
};
