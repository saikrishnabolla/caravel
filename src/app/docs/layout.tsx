import type { ReactNode } from "react";
import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import "fumadocs-ui/style.css";

const tree: Root = {
  name: "Caravel",
  children: [
    { type: "page", name: "Overview", url: "/docs" },
    { type: "page", name: "Generated files", url: "/docs/generated-files" },
  ],
};

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return <RootProvider><DocsLayout tree={tree} nav={{ title: "Caravel" }}>{children}</DocsLayout></RootProvider>;
}
