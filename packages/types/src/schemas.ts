import { z } from 'zod';
import type {
  ComponentTreeNode,
  SerializedEntry,
  SerializedValue,
} from './componentTree';
import type { ProfilerComponentData } from './profiler';

const devicePlatformSchema = z.enum(['ios', 'android']);

const logLevelSchema = z.enum(['log', 'warn', 'error', 'debug']);

const consoleMessageSchema = z.object({
  type: z.literal('console'),
  level: logLevelSchema,
  args: z.array(z.unknown()),
  timestamp: z.number(),
});

const graphqlInfoSchema = z.object({
  operationType: z.enum(['query', 'mutation']),
  operationName: z.string().optional(),
});

const networkMessageSchema = z.object({
  type: z.literal('network'),
  id: z.string(),
  event: z.enum(['request', 'response']),
  method: z.string(),
  url: z.string(),
  requestHeaders: z.record(z.string(), z.string()).optional(),
  requestBody: z.unknown().optional(),
  graphql: graphqlInfoSchema.optional(),
  status: z.number().optional(),
  statusText: z.string().optional(),
  responseHeaders: z.record(z.string(), z.string()).optional(),
  responseBody: z.unknown().optional(),
  duration: z.number().optional(),
  timestamp: z.number(),
});

const componentTreeNodeSchema: z.ZodType<ComponentTreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    key: z.string().nullable(),
    source: z.string().optional(),
    children: z.array(componentTreeNodeSchema),
  }),
);

const componentTreeMessageSchema = z.object({
  type: z.literal('componentTree'),
  rootNodes: z.array(componentTreeNodeSchema),
  timestamp: z.number(),
});

const serializedValueSchema: z.ZodType<SerializedValue> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('primitive'),
      value: z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.undefined(),
      ]),
    }),
    z.object({
      type: z.literal('string'),
      value: z.string(),
      truncated: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('object'),
      preview: z.string(),
      entries: z.array(serializedEntrySchema).optional(),
      dehydrated: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('array'),
      length: z.number(),
      items: z.array(serializedValueSchema).optional(),
      dehydrated: z.boolean().optional(),
    }),
    z.object({ type: z.literal('function'), name: z.string() }),
    z.object({ type: z.literal('symbol'), description: z.string() }),
    z.object({ type: z.literal('element'), elementType: z.string() }),
    z.object({ type: z.literal('circular') }),
    z.object({ type: z.literal('unknown'), preview: z.string() }),
  ]),
);

const serializedEntrySchema: z.ZodType<SerializedEntry> = z.lazy(() =>
  z.object({ key: z.string(), value: serializedValueSchema }),
);

const hookInfoSchema = z.object({
  type: z.string(),
  index: z.number(),
  value: serializedValueSchema,
});

const renderedByEntrySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
});

const inspectedComponentDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  props: z.array(serializedEntrySchema),
  hooks: z.array(hookInfoSchema),
  source: z
    .object({
      fileName: z.string(),
      lineNumber: z.number().optional(),
      columnNumber: z.number().optional(),
    })
    .optional(),
  sourceFile: z.string().optional(),
  renderedBy: z.array(renderedByEntrySchema).optional(),
});

const inspectComponentResponseSchema = z.object({
  type: z.literal('inspectComponent'),
  direction: z.literal('response'),
  componentId: z.string(),
  data: inspectedComponentDataSchema.nullable(),
  timestamp: z.number(),
});

const metadataMessageSchema = z.object({
  type: z.literal('metadata'),
  projectRoot: z.string(),
  timestamp: z.number(),
  deviceId: z.string(),
  deviceName: z.string(),
  platform: devicePlatformSchema,
  osVersion: z.string(),
});

const renderTriggerSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('props'), changedKeys: z.array(z.string()) }),
  z.object({ type: z.literal('state') }),
  z.object({ type: z.literal('hooks') }),
  z.object({ type: z.literal('parent') }),
  z.object({ type: z.literal('unknown') }),
]);

const profilerComponentDataSchema: z.ZodType<ProfilerComponentData> = z.lazy(
  () =>
    z.object({
      id: z.string(),
      name: z.string(),
      actualDuration: z.number(),
      selfBaseDuration: z.number(),
      treeBaseDuration: z.number(),
      phase: z.enum(['mount', 'update', 'did-not-render']),
      skipped: z.boolean(),
      triggers: z.array(renderTriggerSchema),
      children: z.array(profilerComponentDataSchema),
    }),
);

const profilerCommitDataSchema = z.object({
  index: z.number(),
  timestamp: z.number(),
  duration: z.number(),
  components: z.array(profilerComponentDataSchema),
});

const profilerSessionMessageSchema = z.object({
  type: z.literal('profilerSession'),
  commits: z.array(profilerCommitDataSchema),
  timestamp: z.number(),
});

const performanceMetricMessageSchema = z.object({
  type: z.literal('performanceMetric'),
  jsFps: z.number(),
  uiFps: z.number().nullable(),
  jsHeap: z.number().nullable(),
  nativeRam: z.number().nullable(),
  cpuUsage: z.number().nullable(),
  droppedFrames: z.number(),
  gcEvents: z.number(),
  timestamp: z.number(),
});

const startupMetricsMessageSchema = z.object({
  type: z.literal('startupMetrics'),
  jsBundleEval: z.number(),
  nativeLaunch: z.number().nullable(),
  tti: z.number().nullable(),
  timestamp: z.number(),
});

const storageBackendSchema = z.enum(['asyncStorage', 'mmkv']);
const storageValueTypeSchema = z.enum(['string', 'number', 'boolean']);

const storageEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
  valueType: storageValueTypeSchema,
});

const storageBackendInfoSchema = z.object({
  backend: storageBackendSchema,
  available: z.boolean(),
  instanceId: z.string().optional(),
});

const storageCapabilitiesMessageSchema = z.object({
  type: z.literal('storageCapabilities'),
  backends: z.array(storageBackendInfoSchema),
  timestamp: z.number(),
});

const storageDataMessageSchema = z.object({
  type: z.literal('storageData'),
  requestId: z.string(),
  backend: storageBackendSchema,
  instanceId: z.string().optional(),
  entries: z.array(storageEntrySchema),
  timestamp: z.number(),
});

const stateStoreTypeSchema = z.enum(['zustand', 'redux', 'other']);

const stateStoreInfoSchema = z.object({
  name: z.string(),
  storeType: stateStoreTypeSchema,
});

const stateCapabilitiesMessageSchema = z.object({
  type: z.literal('stateCapabilities'),
  stores: z.array(stateStoreInfoSchema),
  timestamp: z.number(),
});

const stateSnapshotMessageSchema = z.object({
  type: z.literal('stateSnapshot'),
  storeName: z.string(),
  state: z.string(),
  timestamp: z.number(),
});

const stateActionMessageSchema = z.object({
  type: z.literal('stateAction'),
  storeName: z.string(),
  actionType: z.string(),
  payload: z.string(),
  state: z.string(),
  timestamp: z.number(),
});

export const radarMessageSchema = z.discriminatedUnion('type', [
  consoleMessageSchema,
  networkMessageSchema,
  componentTreeMessageSchema,
  inspectComponentResponseSchema,
  metadataMessageSchema,
  profilerSessionMessageSchema,
  performanceMetricMessageSchema,
  startupMetricsMessageSchema,
  storageCapabilitiesMessageSchema,
  storageDataMessageSchema,
  stateCapabilitiesMessageSchema,
  stateSnapshotMessageSchema,
  stateActionMessageSchema,
]);
