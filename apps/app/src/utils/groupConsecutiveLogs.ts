import type { LogEntry, GroupedLogEntry } from '../types';

const logContentKey = (entry: LogEntry): string =>
  `${entry.level}:${entry.args.map(a => JSON.stringify(a)).join('|')}`;

export const groupConsecutiveLogs = (logs: LogEntry[]): GroupedLogEntry[] => {
  const groups: GroupedLogEntry[] = [];
  for (const entry of logs) {
    const key = logContentKey(entry);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.entries.push(entry);
      last.lastTimestamp = entry.timestamp;
      last.count++;
    } else {
      groups.push({
        key,
        entries: [entry],
        level: entry.level,
        args: entry.args,
        firstTimestamp: entry.timestamp,
        lastTimestamp: entry.timestamp,
        count: 1,
      });
    }
  }
  return groups;
};
