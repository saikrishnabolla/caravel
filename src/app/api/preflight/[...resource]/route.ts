import { NextRequest } from "next/server";

const PREFLIGHT_DATA_BASE_URL = process.env.PREFLIGHT_DATA_BASE_URL ?? "https://preflight.saibolla.com";

function targetUrl(request: NextRequest, resource: string[]) {
  const target = new URL(`/api/preflight/${resource.map(encodeURIComponent).join("/")}`, PREFLIGHT_DATA_BASE_URL);
  for (const [key, value] of request.nextUrl.searchParams) target.searchParams.append(key, value);
  return target;
}

async function proxy(request: NextRequest, context: { params: Promise<{ resource: string[] }> }) {
  const { resource } = await context.params;
  const target = targetUrl(request, resource);
  try {
    const response = await fetch(target, {
      method: request.method,
      headers: request.method === "POST" ? { "Content-Type": request.headers.get("Content-Type") ?? "application/json" } : undefined,
      body: request.method === "POST" ? await request.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json", "Cache-Control": "no-store", "X-PreFlight-Source": target.origin },
    });
  } catch (error) {
    return Response.json({ error: "The hosted PreFlight evidence service is unavailable", providerStatus: "unavailable", detail: error instanceof Error ? error.message : String(error), target: target.toString() }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ resource: string[] }> }) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ resource: string[] }> }) {
  return proxy(request, context);
}
