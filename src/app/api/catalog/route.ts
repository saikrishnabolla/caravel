import { listProducts, publishProduct } from "@/lib/catalog";

export function GET() {
  return Response.json({ products: listProducts() });
}

export async function POST(request: Request) {
  try {
    return Response.json(publishProduct(await request.json()), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The product could not be published" }, { status: 400 });
  }
}
