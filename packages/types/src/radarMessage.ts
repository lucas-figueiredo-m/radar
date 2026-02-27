import type { ConsoleMessage } from './console';
import type { NetworkMessage } from './network';
import type { ComponentTreeMessage } from './componentTree';

export type RadarMessage = ConsoleMessage | NetworkMessage | ComponentTreeMessage;
