import { buildNegotiation, getVendorQuotes, mandateSchema, selectQuote } from "@/lib/purchasing";

export async function POST(request: Request) {
  try {
    const mandate = mandateSchema.parse(await request.json());
    const negotiation = buildNegotiation(mandate);
    const { decisions, selected } = selectQuote(getVendorQuotes(mandate), mandate);
    return Response.json({ protocol: negotiation.protocol, negotiation, decisions, selected });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Negotiation failed" }, { status: 400 });
  }
}
