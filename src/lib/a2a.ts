import crypto from "node:crypto";
import {
  A2A_PROTOCOL_VERSION,
  type AgentCard,
  type Artifact,
  Role,
  type Task,
  type TaskArtifactUpdateEvent,
  TaskState,
  type TaskStatusUpdateEvent,
} from "@a2a-js/sdk";
import {
  AgentEvent,
  type AgentExecutor,
  DefaultRequestHandler,
  type ExecutionEventBus,
  InMemoryTaskStore,
  JsonRpcTransportHandler,
  type RequestContext,
} from "@a2a-js/sdk/server";
import {
  buildNegotiation,
  getVendorQuotes,
  mandateSchema,
  selectQuote,
} from "./purchasing";

export type MissionClearA2APayload = {
  protocolVersion: string;
  negotiation: ReturnType<typeof buildNegotiation>;
  decisions: ReturnType<typeof selectQuote>["decisions"];
  selected: ReturnType<typeof selectQuote>["selected"];
};

export function createMissionClearAgentCard(origin: string): AgentCard {
  return {
    name: "MissionClear Seller Agent",
    description: "Negotiates and sells agricultural drone mission-readiness packets.",
    supportedInterfaces: [{
      url: `${origin}/api/a2a`,
      protocolBinding: "JSONRPC",
      tenant: "",
      protocolVersion: A2A_PROTOCOL_VERSION,
    }],
    provider: { organization: "Raingentic", url: origin },
    version: "1.0.0",
    capabilities: {
      streaming: true,
      pushNotifications: false,
      extensions: [],
      extendedAgentCard: false,
    },
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: ["text"],
    defaultOutputModes: ["application/json", "task-status"],
    skills: [{
      id: "mission-readiness-negotiation",
      name: "Negotiate mission-readiness services",
      description: "Applies volume and seasonal pricing to airspace, weather, compliance, risk, and telemetry services.",
      tags: ["agriculture", "drones", "compliance", "telemetry", "commerce"],
      examples: ["Negotiate 100 mission-readiness packets under a $1,500 mandate."],
      inputModes: ["text"],
      outputModes: ["application/json", "task-status"],
      securityRequirements: [],
    }],
    documentationUrl: `${origin}/`,
    signatures: [],
  };
}

class MissionClearExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const { taskId, contextId, task: existingTask, userMessage } = requestContext;
    const task: Task = existingTask ?? {
      id: taskId,
      contextId,
      status: { state: TaskState.TASK_STATE_SUBMITTED, timestamp: new Date().toISOString(), message: undefined },
      artifacts: [],
      history: [userMessage],
      metadata: userMessage.metadata,
    };
    eventBus.publish(AgentEvent.task(task));

    const working: TaskStatusUpdateEvent = {
      taskId,
      contextId,
      status: {
        state: TaskState.TASK_STATE_WORKING,
        timestamp: new Date().toISOString(),
        message: {
          role: Role.ROLE_AGENT,
          messageId: crypto.randomUUID(),
          parts: [{
            content: { $case: "text", value: "Evaluating the purchasing mandate and pricing rules." },
            metadata: undefined,
            filename: "",
            mediaType: "text/plain",
          }],
          taskId,
          contextId,
          extensions: [],
          metadata: {},
          referenceTaskIds: [],
        },
      },
      metadata: {},
    };
    eventBus.publish(AgentEvent.statusUpdate(working));
    await new Promise(resolve => setTimeout(resolve, 20));

    const textPart = userMessage.parts.find(part => part.content?.$case === "text");
    const rawMandate = textPart?.content?.$case === "text" ? textPart.content.value : "";
    const mandate = mandateSchema.parse(JSON.parse(rawMandate));
    const negotiation = buildNegotiation(mandate);
    const { decisions, selected } = selectQuote(getVendorQuotes(mandate), mandate);
    const payload: MissionClearA2APayload = {
      protocolVersion: A2A_PROTOCOL_VERSION,
      negotiation,
      decisions,
      selected,
    };

    const artifact: Artifact = {
      artifactId: crypto.randomUUID(),
      name: "Mission readiness negotiated offer",
      description: "Structured offer produced by the MissionClear seller agent.",
      parts: [{
        content: { $case: "text", value: JSON.stringify(payload) },
        metadata: { contentType: "application/json" },
        filename: "mission-readiness-offer.json",
        mediaType: "application/json",
      }],
      metadata: { protocol: "A2A", protocolVersion: A2A_PROTOCOL_VERSION },
      extensions: [],
    };
    const artifactUpdate: TaskArtifactUpdateEvent = {
      taskId,
      contextId,
      artifact,
      lastChunk: true,
      append: false,
      metadata: {},
    };
    eventBus.publish(AgentEvent.artifactUpdate(artifactUpdate));
    await new Promise(resolve => setTimeout(resolve, 20));

    eventBus.publish(AgentEvent.statusUpdate({
      taskId,
      contextId,
      status: { state: TaskState.TASK_STATE_COMPLETED, timestamp: new Date().toISOString(), message: undefined },
      metadata: {},
    }));
  }

  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    eventBus.publish(AgentEvent.statusUpdate({
      taskId,
      contextId: "",
      status: { state: TaskState.TASK_STATE_CANCELED, timestamp: new Date().toISOString(), message: undefined },
      metadata: {},
    }));
  }
}

export type MissionClearA2ARuntime = {
  agentCard: AgentCard;
  requestHandler: DefaultRequestHandler;
  transportHandler: JsonRpcTransportHandler;
};

const runtimes = new Map<string, MissionClearA2ARuntime>();

export function getMissionClearA2ARuntime(origin: string): MissionClearA2ARuntime {
  const existing = runtimes.get(origin);
  if (existing) return existing;
  const agentCard = createMissionClearAgentCard(origin);
  const requestHandler = new DefaultRequestHandler(
    agentCard,
    new InMemoryTaskStore(),
    new MissionClearExecutor(),
  );
  const runtime = {
    agentCard,
    requestHandler,
    transportHandler: new JsonRpcTransportHandler(requestHandler),
  };
  runtimes.set(origin, runtime);
  return runtime;
}
