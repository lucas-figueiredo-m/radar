import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetNetworkRequests = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_network_requests',
    'Query HTTP/GraphQL network requests captured from the React Native app. Returns request summaries (method, url, status, duration). Use get_network_request_detail for full headers and bodies. Without deviceId, returns requests from all devices.',
    {
      method: z
        .string()
        .optional()
        .describe('Filter by HTTP method (GET, POST, etc.)'),
      status: z.number().optional().describe('Filter by HTTP status code'),
      graphqlType: z
        .enum(['query', 'mutation'])
        .optional()
        .describe('Filter by GraphQL operation type'),
      pending: z
        .boolean()
        .optional()
        .describe('Filter by pending status (true = in-flight requests)'),
      limit: z.number().optional().default(50).describe('Max results (default 50)'),
      offset: z.number().optional().default(0).describe('Offset for pagination'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID to filter by. Omit to get requests from all devices.'),
    },
    async ({ method, status, graphqlType, pending, limit, offset, deviceId }) => {
      const requests = ctx.db.network.query({
        device_id: deviceId,
        method,
        status,
        graphql_type: graphqlType,
        pending,
        limit,
        offset,
      });
      const total = ctx.db.network.count({
        device_id: deviceId,
        method,
        status,
        graphql_type: graphqlType,
        pending,
      });

      const summaries = requests.map((r) => ({
        id: r.id,
        deviceId: r.device_id,
        method: r.method,
        url: r.url,
        status: r.status,
        duration: r.duration,
        pending: r.pending === 1,
        graphql: r.graphql_type
          ? { type: r.graphql_type, name: r.graphql_name }
          : null,
        timestamp: r.timestamp,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ total, requests: summaries }, null, 2),
          },
        ],
      };
    },
  );
};
