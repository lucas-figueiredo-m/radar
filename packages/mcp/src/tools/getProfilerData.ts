import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { fenceUntrusted } from './fenceUntrusted';
import { UNTRUSTED_DATA_WARNING } from './untrustedDataWarning';

export const registerGetProfilerData = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_profiler_data',
    'Get React profiler data showing component render times, phases (mount/update/did-not-render), and render triggers. Without sessionId returns the latest session. With sessionId returns commits for that specific session.',
    {
      sessionId: z
        .number()
        .optional()
        .describe('Profiler session ID. Omit to get the latest session.'),
      deviceId: z
        .string()
        .optional()
        .describe(
          'Device ID to filter by. Omit to get the latest session from any device.',
        ),
    },
    async ({ sessionId, deviceId }) => {
      if (sessionId) {
        const commits = ctx.db.profiler.getCommitsBySession(sessionId);
        const parsed = commits.map(c => ({
          deviceId: c.device_id,
          commitIndex: c.commit_index,
          duration: c.duration,
          timestamp: c.timestamp,
          components: fenceUntrusted(
            JSON.parse(c.components),
            `profiler.session[${sessionId}].commit[${c.commit_index}].components`,
          ),
        }));
        return {
          content: [
            {
              type: 'text' as const,
              text: `${UNTRUSTED_DATA_WARNING}\n${JSON.stringify(
                { sessionId, commitCount: parsed.length, commits: parsed },
                null,
                2,
              )}`,
            },
          ],
        };
      }

      const latestSession = ctx.db.profiler.getLatestSession(deviceId);
      if (!latestSession) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No profiler sessions available. Use start_profiling to begin a profiling session.',
            },
          ],
        };
      }

      const commits = ctx.db.profiler.getCommitsBySession(latestSession.id);
      const parsed = commits.map(c => ({
        deviceId: c.device_id,
        commitIndex: c.commit_index,
        duration: c.duration,
        timestamp: c.timestamp,
        components: fenceUntrusted(
          JSON.parse(c.components),
          `profiler.session[${latestSession.id}].commit[${c.commit_index}].components`,
        ),
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: `${UNTRUSTED_DATA_WARNING}\n${JSON.stringify(
              {
                sessionId: latestSession.id,
                deviceId: latestSession.device_id,
                sessionTimestamp: latestSession.timestamp,
                commitCount: parsed.length,
                commits: parsed,
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
