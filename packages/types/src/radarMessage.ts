import type { ConsoleMessage } from './console';
import type { NetworkMessage } from './network';
import type { ComponentTreeMessage, InspectComponentResponse, InspectComponentRequest } from './componentTree';
import type { MetadataMessage } from './metadata';
import type { ProfilerSessionMessage, StartProfilingCommand, StopProfilingCommand, ReloadAndProfileCommand, ProfilingStatusCommand } from './profiler';
import type { PerformanceMetricMessage } from './performance';

export type RadarMessage = ConsoleMessage | NetworkMessage | ComponentTreeMessage | InspectComponentResponse | MetadataMessage | ProfilerSessionMessage | PerformanceMetricMessage;

export type RadarCommand = InspectComponentRequest | StartProfilingCommand | StopProfilingCommand | ReloadAndProfileCommand | ProfilingStatusCommand;
