import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetNetworkRequestDetail = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_network_request_detail',
    'Get full details of a specific network request including headers and bodies. Use the requestId from get_network_requests.',
    {
      requestId: z.string().describe('The network request ID'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ requestId }) => {
      const request = ctx.db.network.getById(requestId);
      if (!request) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Network request not found: ${requestId}`,
            },
          ],
          isError: true,
        };
      }

      const detail = {
        id: request.id,
        method: request.method,
        url: request.url,
        status: request.status,
        statusText: request.status_text,
        duration: request.duration,
        pending: request.pending === 1,
        graphql: request.graphql_type
          ? { type: request.graphql_type, name: request.graphql_name }
          : null,
        requestHeaders: request.request_headers
          ? JSON.parse(request.request_headers)
          : null,
        requestBody: request.request_body
          ? JSON.parse(request.request_body)
          : null,
        responseHeaders: request.response_headers
          ? JSON.parse(request.response_headers)
          : null,
        responseBody: request.response_body
          ? JSON.parse(request.response_body)
          : null,
        timestamp: request.timestamp,
        responseTimestamp: request.response_timestamp,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(detail, null, 2),
          },
        ],
      };
    },
  );
};
