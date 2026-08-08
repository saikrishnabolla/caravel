import { getMissionClearA2ARuntime } from "@/lib/a2a";

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return Response.json(getMissionClearA2ARuntime(origin).agentCard, {
    headers: { "Cache-Control": "no-store" },
  });
}
