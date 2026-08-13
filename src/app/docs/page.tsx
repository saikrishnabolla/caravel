import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";

export default function DocsOverview() {
  return <DocsPage><DocsTitle>Turn an API into an agent product</DocsTitle><DocsDescription>Connect an OpenAPI document, check what is missing, then build the files needed for discovery, docs, SDKs, and access.</DocsDescription><DocsBody><h2>Connect</h2><pre><code>caravel connect https://example.com/openapi.json</code></pre><h2>Build</h2><pre><code>caravel build --x402-price 0.01 --x402-pay-to 0x1234</code></pre><p>API-key access stays available unless you disable it. x402 adds a second machine-payment path.</p></DocsBody></DocsPage>;
}
