import http from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server';
import type { McpContext, McpServerHandle } from './types';

const MCP_PORT = 8348;

type SessionEntry = {
  transport: StreamableHTTPServerTransport;
  server: ReturnType<typeof createMcpServer>;
};

export const startMcpServer = (
  ctx: McpContext & { port?: number },
): McpServerHandle => {
  const port = ctx.port ?? MCP_PORT;

  const sessions = new Map<string, SessionEntry>();

  const parseBody = (
    req: http.IncomingMessage,
  ): Promise<Record<string, unknown>> =>
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch {
          resolve({});
        }
      });
      req.on('error', reject);
    });

  const httpServer = http.createServer(async (req, res) => {
    if (req.url !== '/mcp') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    try {
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        if (sessionId && sessions.has(sessionId)) {
          const session = sessions.get(sessionId)!;
          await session.transport.handleRequest(req, res, body);
          return;
        }

        // Create a new MCP server + transport per session
        const mcpServer = createMcpServer(ctx);

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: (id) => {
            sessions.set(id, { transport, server: mcpServer });
          },
        });

        transport.onclose = () => {
          const id = [...sessions.entries()].find(
            ([, s]) => s.transport === transport,
          )?.[0];
          if (id) sessions.delete(id);
        };

        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, body);
      } else if (req.method === 'GET') {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (!sessionId || !sessions.has(sessionId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No active session' }));
          return;
        }
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res);
      } else if (req.method === 'DELETE') {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        if (sessionId && sessions.has(sessionId)) {
          const session = sessions.get(sessionId)!;
          await session.transport.handleRequest(req, res);
          sessions.delete(sessionId);
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No active session' }));
        }
      } else {
        res.writeHead(405);
        res.end('Method not allowed');
      }
    } catch (err) {
      console.error('[radar] MCP request error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  });

  httpServer.listen(port, () => {
    console.log(`[radar] MCP server listening on http://localhost:${port}/mcp`);
  });

  return {
    close: () => {
      for (const session of sessions.values()) {
        session.transport.close();
      }
      sessions.clear();
      httpServer.close();
    },
  };
};

export type { McpServerHandle, McpContext, WebSocketHandle } from './types';
