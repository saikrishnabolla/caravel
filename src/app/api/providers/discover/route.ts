import { parsedMandateSchema } from "@/lib/mandate";
import { discoverProviders } from "@/lib/providers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mandate = parsedMandateSchema.parse(body.mandate);
    return Response.json({ providers: discoverProviders({ ...mandate, source: "deterministic-fallback" }) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Provider discovery failed" }, { status: 400 });
  }
}
