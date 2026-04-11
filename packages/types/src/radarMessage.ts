import type { ConsoleMessage } from './console';
import type { NetworkMessage } from './network';
import type { ComponentTreeMessage, InspectComponentResponse, InspectComponentRequest } from './componentTree';
import type { MetadataMessage } from './metadata';
import type { ProfilerSessionMessage, StartProfilingCommand, StopProfilingCommand, ReloadAndProfileCommand, ProfilingStatusCommand } from './profiler';
import type { PerformanceMetricMessage } from './performance';
import type { StartupMetricsMessage } from './startup';
import type { StorageCapabilitiesMessage, StorageDataMessage, StorageCommand } from './storage';
import type { StateCapabilitiesMessage, StateSnapshotMessage, StateGetCommand } from './stateManagement';

export type RadarMessage = ConsoleMessage | NetworkMessage | ComponentTreeMessage | InspectComponentResponse | MetadataMessage | ProfilerSessionMessage | PerformanceMetricMessage | StartupMetricsMessage | StorageCapabilitiesMessage | StorageDataMessage | StateCapabilitiesMessage | StateSnapshotMessage;

export type RadarCommand = InspectComponentRequest | StartProfilingCommand | StopProfilingCommand | ReloadAndProfileCommand | ProfilingStatusCommand | StorageCommand | StateGetCommand;
