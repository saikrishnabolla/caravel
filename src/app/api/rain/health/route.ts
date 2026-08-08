import { checkRainConnection } from "@/lib/rain";

export async function GET() {
  try {
    const result = await checkRainConnection();
    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        connected: false,
        message: error instanceof Error ? error.message : "Rain connection failed",
      },
      { status: 503 },
    );
  }
}
