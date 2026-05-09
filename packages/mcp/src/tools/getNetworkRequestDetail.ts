import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { fenceUntrusted } from './fenceUntrusted';
import { UNTRUSTED_DATA_WARNING } from './untrustedDataWarning';

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

      const detailId = request.id;
      const detail = {
        id: request.id,
        method: request.method,
        url: fenceUntrusted(request.url, `network.request[${detailId}].url`),
        status: request.status,
        statusText: request.status_text
          ? fenceUntrusted(
              request.status_text,
              `network.request[${detailId}].statusText`,
            )
          : null,
        duration: request.duration,
        pending: request.pending === 1,
        graphql: request.graphql_type
          ? {
              type: request.graphql_type,
              name: fenceUntrusted(
                request.graphql_name,
                `network.request[${detailId}].graphql.name`,
              ),
            }
          : null,
        requestHeaders: request.request_headers
          ? fenceUntrusted(
              JSON.parse(request.request_headers),
              `network.request[${detailId}].requestHeaders`,
            )
          : null,
        requestBody: request.request_body
          ? fenceUntrusted(
              JSON.parse(request.request_body),
              `network.request[${detailId}].requestBody`,
            )
          : null,
        responseHeaders: request.response_headers
          ? fenceUntrusted(
              JSON.parse(request.response_headers),
              `network.request[${detailId}].responseHeaders`,
            )
          : null,
        responseBody: request.response_body
          ? fenceUntrusted(
              JSON.parse(request.response_body),
              `network.request[${detailId}].responseBody`,
            )
          : null,
        timestamp: request.timestamp,
        responseTimestamp: request.response_timestamp,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: `${UNTRUSTED_DATA_WARNING}\n${JSON.stringify(
              detail,
              null,
              2,
            )}`,
          },
        ],
      };
    },
  );
};
