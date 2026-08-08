import { getTreasurySandboxStatus, RainApiError, runTreasurySandboxDemo } from "@/lib/rain";

export async function GET() {
  try {
    return Response.json(await getTreasurySandboxStatus());
  } catch (error) {
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json({ error: detail ?? (error instanceof Error ? error.message : "Rain treasury status failed") }, { status: 500 });
  }
}

export async function POST() {
  try {
    const destinationAddress = process.env.MONAD_PROVIDER_ADDRESS;
    if (!destinationAddress) throw new Error("MONAD_PROVIDER_ADDRESS is required as the demo EVM destination");
    return Response.json(await runTreasurySandboxDemo(destinationAddress));
  } catch (error) {
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json({ error: detail ?? (error instanceof Error ? error.message : "Rain treasury simulation failed") }, { status: 500 });
  }
}
