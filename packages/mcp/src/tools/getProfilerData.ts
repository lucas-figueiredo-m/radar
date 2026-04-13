import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerGetProfilerData = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_profiler_data',
    'Get React profiler data showing component render times, phases (mount/update/did-not-render), and render triggers. Without sessionId returns the latest session with all commits. With sessionId returns commits for that specific session.',
    {
      sessionId: z
        .number()
        .optional()
        .describe('Profiler session ID. Omit to get the latest session.'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ sessionId, deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);

      if (sessionId) {
        const commits = ctx.db.profiler.getCommitsBySession(sessionId);
        const parsed = commits.map((c) => ({
          commitIndex: c.commit_index,
          duration: c.duration,
          timestamp: c.timestamp,
          components: JSON.parse(c.components),
        }));
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { sessionId, commitCount: parsed.length, commits: parsed },
                null,
                2,
              ),
            },
          ],
        };
      }

      const latestSession = ctx.db.profiler.getLatestSession(resolvedId);
      if (!latestSession) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No profiler sessions available. Use send_command with "startProfiling" to begin a profiling session.',
            },
          ],
        };
      }

      const commits = ctx.db.profiler.getCommitsBySession(latestSession.id);
      const parsed = commits.map((c) => ({
        commitIndex: c.commit_index,
        duration: c.duration,
        timestamp: c.timestamp,
        components: JSON.parse(c.components),
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                sessionId: latestSession.id,
                sessionTimestamp: latestSession.timestamp,
                commitCount: parsed.length,
                commits: parsed,
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
