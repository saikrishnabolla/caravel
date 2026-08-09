import { gunzipSync, gzipSync } from "node:zlib";

export type PublishedCommerceProduct = {
  id: string;
  name: string;
  type: "api" | "product" | "service" | "software";
  method?: string;
  path?: string;
  endpointUrl?: string;
  pricing: {
    amount: number;
    currency: string;
    unit: string;
    floor: number;
    maximumDiscountPercent: number;
  };
  payment: {
    rail: string;
    approvalRequired: boolean;
  };
};

export type CommercePublication = {
  schema: "raingentic-commerce-publication/v1";
  id: string;
  organization: string;
  status: "published";
  source: { type: string; url: string; title: string };
  products: PublishedCommerceProduct[];
  policy: Record<string, unknown> | null;
  discovery: {
    publicationUrl: string;
    agentCardUrl: string;
    catalogUrl: string;
  };
  publishedAt: string;
};

declare global {
  var __raingenticPublications: Map<string, CommercePublication> | undefined;
}

const publications = globalThis.__raingenticPublications ?? new Map<string, CommercePublication>();
globalThis.__raingenticPublications = publications;

export function publicationSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "publication";
}

export function savePublication(publication: CommercePublication) {
  publications.set(publication.id, publication);
  return publication;
}

export function getPublication(id: string) {
  return publications.get(publicationSlug(id));
}

export function listPublications() {
  return Array.from(publications.values());
}

export function encodePublication(publication: CommercePublication) {
  return gzipSync(Buffer.from(JSON.stringify(publication))).toString("base64url");
}

export function decodePublication(value: string) {
  const decoded = JSON.parse(gunzipSync(Buffer.from(value, "base64url")).toString("utf8")) as CommercePublication;
  if (decoded.schema !== "raingentic-commerce-publication/v1" || !Array.isArray(decoded.products)) throw new Error("Invalid commerce publication");
  return decoded;
}
