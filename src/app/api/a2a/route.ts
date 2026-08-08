import { A2A_PROTOCOL_VERSION } from "@a2a-js/sdk";
import { ServerCallContext } from "@a2a-js/sdk/server";
import { getMissionClearA2ARuntime } from "@/lib/a2a";

function isAsyncGenerator(value: unknown): value is AsyncGenerator<unknown, void, undefined> {
  return Boolean(value && typeof value === "object" && Symbol.asyncIterator in value);
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const body = await request.text();
  const requestedVersion = request.headers.get("A2A-Version") ?? A2A_PROTOCOL_VERSION;
  const context = new ServerCallContext({
    requestedVersion,
    tenant: "",
    state: new Map([["headers", Object.fromEntries(request.headers.entries())]]),
  });
  const result = await getMissionClearA2ARuntime(origin).transportHandler.handle(body, context);

  if (isAsyncGenerator(result)) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of result) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : "A2A stream failed" })}\n\n`));
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "A2A-Version": A2A_PROTOCOL_VERSION,
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
      },
    });
  }

  return Response.json(result, { headers: { "A2A-Version": A2A_PROTOCOL_VERSION } });
}
