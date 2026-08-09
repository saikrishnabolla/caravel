import { createPreflightOpenApi } from "@/lib/preflight-openapi";

export function GET(request: Request) {
  return Response.json(createPreflightOpenApi(new URL(request.url).origin));
}
