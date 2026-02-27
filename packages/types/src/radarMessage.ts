import type { ConsoleMessage } from './console';
import type { NetworkMessage } from './network';
import type { ComponentTreeMessage, InspectComponentResponse, InspectComponentRequest } from './componentTree';

export type RadarMessage = ConsoleMessage | NetworkMessage | ComponentTreeMessage | InspectComponentResponse;

export type RadarCommand = InspectComponentRequest;
