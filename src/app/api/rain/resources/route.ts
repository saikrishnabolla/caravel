import crypto from "node:crypto";
import {
  createDemoPaymentAccount,
  createPaymentRoute,
  deletePaymentAccount,
  deletePaymentRoute,
  getPaymentAccount,
  getPaymentRoute,
  RainApiError,
  updatePaymentRoute,
} from "@/lib/rain";

export async function POST() {
  const steps: Array<{ title: string; detail: string; status: string; id?: string }> = [];
  let accountId: string | undefined;
  let routeId: string | undefined;

  try {
    const suffix = crypto.randomUUID().slice(0, 8);
    const account = await createDemoPaymentAccount(`Caravel lifecycle ${suffix}`);
    accountId = account.id;
    steps.push({ title: "Temporary payment account created", detail: "A sandbox USD payout destination was created for the lifecycle proof.", status: "created", id: account.id });

    const fetchedAccount = await getPaymentAccount(account.id);
    steps.push({ title: "Payment account fetched", detail: `Rain returned ${fetchedAccount.nickname}.`, status: "retrieved", id: fetchedAccount.id });

    const destinationAddress = `0x${crypto.randomBytes(20).toString("hex")}`;
    const route = await createPaymentRoute({
      source: { currency: "usd", rail: "ach" },
      destination: { currency: "rusd", rail: "base", address: { type: "onchain", address: destinationAddress } },
    });
    routeId = route.id;
    steps.push({ title: "Temporary payment route created", detail: "The route represents a sandbox USD ACH to RUSD on Base onramp.", status: route.status, id: route.id });

    const fetchedRoute = await getPaymentRoute(route.id);
    steps.push({ title: "Payment route fetched", detail: `${fetchedRoute.source.currency.toUpperCase()} ${fetchedRoute.source.rail.toUpperCase()} to ${fetchedRoute.destination.currency.toUpperCase()} on ${fetchedRoute.destination.rail}.`, status: "retrieved", id: fetchedRoute.id });

    const transferMessage = `DEMO ${suffix}`.slice(0, 23);
    const updatedRoute = await updatePaymentRoute(route.id, { transferMessage });
    steps.push({ title: "Payment route updated", detail: `The sandbox transfer message is ${updatedRoute.transferMessage ?? transferMessage}.`, status: "updated", id: updatedRoute.id });

    await deletePaymentRoute(route.id);
    routeId = undefined;
    steps.push({ title: "Payment route deleted", detail: "The temporary route was removed after the proof completed.", status: "deleted", id: route.id });

    await deletePaymentAccount(account.id);
    accountId = undefined;
    steps.push({ title: "Payment account deleted", detail: "The temporary payout account was removed after the proof completed.", status: "deleted", id: account.id });

    return Response.json({ title: "Rain payment resource lifecycle", steps });
  } catch (error) {
    if (routeId) await deletePaymentRoute(routeId).catch(() => undefined);
    if (accountId) await deletePaymentAccount(accountId).catch(() => undefined);
    const detail = error instanceof RainApiError ? error.detail : undefined;
    return Response.json({ error: detail ?? (error instanceof Error ? error.message : "Rain resource proof failed") }, { status: 500 });
  }
}
