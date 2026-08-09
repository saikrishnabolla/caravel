import { z } from "zod";

export const catalogProductSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  type: z.enum(["API", "Data", "Software", "Service", "Hardware"]),
  price: z.coerce.number().positive(),
  floor: z.coerce.number().positive(),
  maximumDiscountPercent: z.coerce.number().min(0).max(100),
}).refine(product => product.floor <= product.price, { message: "Minimum price cannot exceed the starting price" });

export type CatalogProduct = z.infer<typeof catalogProductSchema> & {
  publishedAt: string;
  agentSkillId: string;
  paymentMethods: string[];
};

declare global {
  var __raingenticCatalog: Map<string, CatalogProduct> | undefined;
}

const catalog = globalThis.__raingenticCatalog ?? new Map<string, CatalogProduct>();
globalThis.__raingenticCatalog = catalog;

export function publishProduct(input: unknown) {
  const product = catalogProductSchema.parse(input);
  const published: CatalogProduct = {
    ...product,
    publishedAt: new Date().toISOString(),
    agentSkillId: `sell-${product.id}`,
    paymentMethods: product.type === "API" || product.type === "Data" ? ["Monad x402", "Existing checkout"] : ["Stablecoin transfer", "Rain card", "Existing checkout"],
  };
  catalog.set(product.id, published);
  return published;
}

export function listProducts() {
  return [...catalog.values()];
}
