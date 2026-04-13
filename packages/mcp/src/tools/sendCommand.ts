import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerSendCommand = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'send_command',
    'Send a command to the connected React Native device: start/stop profiling, reload and profile, or request a fresh state snapshot.',
    {
      command: z
        .enum([
          'startProfiling',
          'stopProfiling',
          'reloadAndProfile',
          'refreshState',
        ])
        .describe('The command to send to the device'),
      storeName: z
        .string()
        .optional()
        .describe(
          'Store name (required for "refreshState" command)',
        ),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ command, storeName, deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);

      switch (command) {
        case 'startProfiling':
          ctx.wsHandle.sendToDevice(
            resolvedId,
            JSON.stringify({ type: 'startProfiling' }),
          );
          return {
            content: [
              { type: 'text' as const, text: 'Profiling started on device.' },
            ],
          };

        case 'stopProfiling':
          ctx.wsHandle.sendToDevice(
            resolvedId,
            JSON.stringify({ type: 'stopProfiling' }),
          );
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Profiling stopped. Use get_profiler_data to retrieve results.',
              },
            ],
          };

        case 'reloadAndProfile':
          ctx.wsHandle.sendToDevice(
            resolvedId,
            JSON.stringify({ type: 'reloadAndProfile' }),
          );
          return {
            content: [
              {
                type: 'text' as const,
                text: 'App reloading with profiling enabled. Use get_profiler_data after reload completes.',
              },
            ],
          };

        case 'refreshState':
          if (!storeName) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: '"storeName" is required for the "refreshState" command.',
                },
              ],
              isError: true,
            };
          }
          ctx.wsHandle.sendToDevice(
            resolvedId,
            JSON.stringify({ type: 'stateGet', storeName }),
          );
          return {
            content: [
              {
                type: 'text' as const,
                text: `Requested fresh state snapshot for "${storeName}". Use get_state_snapshot to retrieve it.`,
              },
            ],
          };

        default:
          return {
            content: [
              { type: 'text' as const, text: `Unknown command: ${command}` },
            ],
            isError: true,
          };
      }
    },
  );
};
