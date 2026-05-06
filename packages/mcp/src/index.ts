import http from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from './server';
import { verifyMcpOrigin } from './verifyMcpOrigin';
import { verifyMcpToken } from './verifyMcpToken';
import type { McpContext, McpServerHandle } from './types';

const MCP_PORT = 8348;
const MCP_HOST = '127.0.0.1';
const MAX_BODY_BYTES = 1 * 1024 * 1024;

type SessionEntry = {
  transport: StreamableHTTPServerTransport;
  server: ReturnType<typeof createMcpServer>;
};

type ParseBodyResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; reason: 'too_large' | 'invalid_json' };

export const startMcpServer = (
  ctx: McpContext & { port?: number; token: string },
): McpServerHandle => {
  const port = ctx.port ?? MCP_PORT;
  const { token } = ctx;

  const sessions = new Map<string, SessionEntry>();

  const parseBody = (req: http.IncomingMessage): Promise<ParseBodyResult> =>
    new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let total = 0;
      let aborted = false;
      req.on('data', (chunk: Buffer) => {
        if (aborted) return;
        total += chunk.length;
        if (total > MAX_BODY_BYTES) {
          aborted = true;
          resolve({ ok: false, reason: 'too_large' });
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        if (aborted) return;
        try {
          resolve({
            ok: true,
            body: JSON.parse(Buffer.concat(chunks).toString()),
          });
        } catch {
          resolve({ ok: false, reason: 'invalid_json' });
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

    if (!verifyMcpOrigin(req.headers.origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Origin not allowed' }));
      return;
    }

    if (!verifyMcpToken(req.headers.authorization, token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    try {
      if (req.method === 'POST') {
        const parsed = await parseBody(req);
        if (!parsed.ok) {
          if (parsed.reason === 'too_large') {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Payload too large' }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON body' }));
          }
          return;
        }
        const body = parsed.body;
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        if (sessionId && sessions.has(sessionId)) {
          const session = sessions.get(sessionId)!;
          await session.transport.handleRequest(req, res, body);
          return;
        }

        const mcpServer = createMcpServer(ctx);

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: id => {
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

  httpServer.listen(port, MCP_HOST, () => {
    console.log(
      `[radar] MCP server listening on http://${MCP_HOST}:${port}/mcp (loopback only, bearer-token gated)`,
    );
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
