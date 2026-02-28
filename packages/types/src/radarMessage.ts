import type { ConsoleMessage } from './console';
import type { NetworkMessage } from './network';
import type { ComponentTreeMessage, InspectComponentResponse, InspectComponentRequest } from './componentTree';
import type { MetadataMessage } from './metadata';

export type RadarMessage = ConsoleMessage | NetworkMessage | ComponentTreeMessage | InspectComponentResponse | MetadataMessage;

export type RadarCommand = InspectComponentRequest;
