import { z } from "zod";
import { compileSellingPolicy } from "@/lib/selling-policy";

const inputSchema = z.object({ instructions: z.string().min(10).max(5000), product: z.string().min(1), resource: z.string().min(1), basePrice: z.number().nonnegative(), minimumPrice: z.number().nonnegative(), maximumDiscountPercent: z.number().min(0).max(100), settlement: z.string().min(1), currency: z.enum(["USD", "USDC"]) });

export async function POST(request: Request) {
  try { return Response.json(await compileSellingPolicy(inputSchema.parse(await request.json()))); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Selling policy compilation failed" }, { status: 400 }); }
}
