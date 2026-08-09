import { encodePublication, listPublications, publicationSlug, savePublication, type CommercePublication, type PublishedCommerceProduct } from "@/lib/publications";

type PublicationRequest = {
  slug?: string;
  organization?: string;
  source?: { type?: string; url?: string; title?: string };
  products?: PublishedCommerceProduct[];
  policy?: Record<string, unknown> | null;
};

export async function GET() {
  return Response.json({ publications: listPublications() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as PublicationRequest;
    const products = Array.isArray(body.products) ? body.products : [];
    if (products.length === 0) throw new Error("At least one priced product is required");
    const organization = body.organization?.trim() || "Company";
    const id = publicationSlug(body.slug || organization);
    const origin = new URL(request.url).origin;
    const publication: CommercePublication = {
      schema: "raingentic-commerce-publication/v1",
      id,
      organization,
      status: "published",
      source: {
        type: body.source?.type || "openapi",
        url: body.source?.url || "",
        title: body.source?.title || `${organization} catalog`,
      },
      products,
      policy: body.policy ?? null,
      discovery: {
        publicationUrl: `${origin}/api/publications/${id}`,
        agentCardUrl: `${origin}/.well-known/agent-card.json`,
        catalogUrl: `${origin}/api/catalog`,
      },
      publishedAt: new Date().toISOString(),
    };
    const contract = encodePublication(publication);
    publication.discovery.publicationUrl = `${origin}/api/publications/${id}?contract=${contract}`;
    savePublication(publication);
    return Response.json(publication, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Publication failed" }, { status: 400 });
  }
}
