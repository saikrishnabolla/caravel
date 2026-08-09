import { z } from "zod";
import { parseBusinessMandate } from "@/lib/mandate";

const requestSchema = z.object({ request: z.string().min(10).max(5000) });

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    return Response.json(await parseBusinessMandate(body.request));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The mandate could not be prepared" }, { status: 400 });
  }
}
