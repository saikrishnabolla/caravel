import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";

export default function GeneratedFilesPage() {
  return <DocsPage><DocsTitle>Generated files</DocsTitle><DocsDescription>Caravel writes deployable source files into .caravel/generated.</DocsDescription><DocsBody><ul><li><code>.well-known/caravel.json</code> for agent discovery.</li><li><code>fern/</code> for TypeScript and Python SDK generation.</li><li><code>docs/*.mdx</code> for a Fumadocs portal.</li><li><code>access/next.ts</code> for API-key and optional x402 access.</li></ul></DocsBody></DocsPage>;
}
