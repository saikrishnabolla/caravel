import { createScopedCard, RainApiError } from "@/lib/rain";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      amountCents?: number;
      allowedMccs?: string[];
      expirationMinutes?: number;
    };

    const amountCents = Math.round(Number(body.amountCents));
    const allowedMccs = Array.from(
      new Set((body.allowedMccs ?? []).map(value => String(value).trim()).filter(Boolean)),
    );
    const expirationMinutes = Math.round(Number(body.expirationMinutes ?? 60));

    if (!Number.isFinite(amountCents) || amountCents < 1) {
      return Response.json({ error: "Enter a card limit greater than $0.00." }, { status: 400 });
    }
    if (allowedMccs.length === 0 || allowedMccs.some(value => !/^\d{4}$/.test(value))) {
      return Response.json({ error: "Enter at least one four-digit merchant category code." }, { status: 400 });
    }
    if (!Number.isFinite(expirationMinutes) || expirationMinutes < 15 || expirationMinutes > 1_440) {
      return Response.json({ error: "Card expiration must be between 15 minutes and 24 hours." }, { status: 400 });
    }

    const card = await createScopedCard({ amountCents, allowedMccs, expirationMinutes });
    return Response.json({
      card,
      controls: {
        amountCents,
        allowedMccs,
        expirationMinutes,
        expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json(
      { error: detail ?? (error instanceof Error ? error.message : "Rain card creation failed") },
      { status: 500 },
    );
  }
}
