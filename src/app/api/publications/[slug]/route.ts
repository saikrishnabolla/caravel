import { decodePublication, getPublication } from "@/lib/publications";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const contract = new URL(request.url).searchParams.get("contract");
  let publication;
  try { publication = contract ? decodePublication(contract) : getPublication((await params).slug); }
  catch { return Response.json({ error: "The hosted commerce contract is invalid" }, { status: 400 }); }
  if (!publication) return Response.json({ error: "Publication not found" }, { status: 404 });
  if (contract) publication.discovery.publicationUrl = request.url;
  return Response.json(publication, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
