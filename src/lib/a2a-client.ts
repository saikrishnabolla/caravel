import crypto from "node:crypto";
import {
  ClientFactory,
  ClientFactoryOptions,
  JsonRpcTransportFactory,
} from "@a2a-js/sdk/client";
import { Role, type Task } from "@a2a-js/sdk";
import type { Mandate } from "./purchasing";
import type { MissionClearA2APayload } from "./a2a";

export type A2ANegotiationResult = MissionClearA2APayload & {
  taskId: string;
  contextId: string;
};

export async function negotiateThroughA2A(origin: string, mandate: Mandate): Promise<A2ANegotiationResult> {
  const factory = new ClientFactory(ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
    transports: [new JsonRpcTransportFactory()],
  }));
  const client = await factory.createFromUrl(origin);
  const response = await client.sendMessage({
    tenant: "",
    metadata: {},
    message: {
      messageId: crypto.randomUUID(),
      role: Role.ROLE_USER,
      parts: [{
        content: { $case: "text", value: JSON.stringify(mandate) },
        metadata: { contentType: "application/json" },
        filename: "purchasing-mandate.json",
        mediaType: "application/json",
      }],
      taskId: "",
      contextId: "",
      extensions: [],
      metadata: { purpose: "mission-readiness-negotiation" },
      referenceTaskIds: [],
    },
    configuration: undefined,
  });

  if (!("status" in response)) throw new Error("A2A seller returned a message instead of a negotiation task");
  const task = response as Task;
  const artifactPart = task.artifacts
    ?.flatMap(artifact => artifact.parts)
    .find(part => part.content?.$case === "text" && part.mediaType === "application/json");
  if (artifactPart?.content?.$case !== "text") throw new Error("A2A negotiation artifact was missing");
  const payload = JSON.parse(artifactPart.content.value) as MissionClearA2APayload;
  return { ...payload, taskId: task.id, contextId: task.contextId };
}
