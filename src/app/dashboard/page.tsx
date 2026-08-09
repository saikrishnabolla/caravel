import { CommerceDashboard } from "@/components/commerce-dashboard";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const params = await searchParams;
  return <CommerceDashboard initialDemoPrompt={Boolean(params.demo)} />;
}
