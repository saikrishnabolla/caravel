import { z } from "zod";
import { prepareCommerceSetup } from "@/lib/setup-agent";

const schema = z.object({ request: z.string().min(10).max(5000), catalog: z.unknown() });

export async function POST(request: Request) {
  try { const body = schema.parse(await request.json()); return Response.json(await prepareCommerceSetup(body.request, body.catalog)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Setup planning failed" }, { status: 400 }); }
}
