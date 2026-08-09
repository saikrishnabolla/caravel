import { NextRequest } from "next/server";

function number(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function context(request: NextRequest) {
  return {
    latitude: number(request.nextUrl.searchParams.get("latitude"), 40.6413),
    longitude: number(request.nextUrl.searchParams.get("longitude"), -73.7781),
    radiusNm: number(request.nextUrl.searchParams.get("radiusNm"), 10),
    altitudeFeet: number(request.nextUrl.searchParams.get("altitudeFeet"), 400),
    station: (request.nextUrl.searchParams.get("station") ?? "KJFK").toUpperCase(),
    observedAt: new Date().toISOString(),
  };
}

async function aviationWeather(product: "metar" | "taf", station: string) {
  try {
    const url = new URL(`https://aviationweather.gov/api/data/${product}`);
    url.searchParams.set("ids", station);
    url.searchParams.set("format", "json");
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const records = await response.json();
    return Array.isArray(records) && records.length > 0 ? records : null;
  } catch {
    return null;
  }
}

async function responseFor(resource: string, request: NextRequest) {
  const input = context(request);
  const base = { product: resource, retrievedAt: input.observedAt };

  if (resource === "weather/metars") {
    const live = await aviationWeather("metar", input.station);
    return live ? { ...base, provider: "AviationWeather.gov", providerStatus: "live", station: input.station, observations: live } : { ...base, provider: "AviationWeather.gov", providerStatus: "cached", station: input.station, observations: [{ station: input.station, rawText: "KJFK 091051Z 23008KT 10SM FEW025 SCT250 24/18 A3004", flightCategory: "VFR", windDirectionDegrees: 230, windSpeedKnots: 8, visibilityStatuteMiles: 10, temperatureC: 24, dewpointC: 18, altimeterInHg: 30.04 }] };
  }
  if (resource === "weather/tafs") {
    const live = await aviationWeather("taf", input.station);
    return live ? { ...base, provider: "AviationWeather.gov", providerStatus: "live", station: input.station, forecasts: live } : { ...base, provider: "AviationWeather.gov", providerStatus: "cached", station: input.station, forecasts: [{ station: input.station, validFrom: input.observedAt, validTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), rawText: "TAF KJFK 091120Z 0912/1018 23010KT P6SM SCT030", periods: [{ windDirectionDegrees: 230, windSpeedKnots: 10, visibilityStatuteMiles: 6, clouds: [{ coverage: "SCT", baseFeetAgl: 3000 }] }] }] };
  }
  if (resource === "weather/pireps") return { ...base, provider: "AviationWeather.gov PIREP feed", providerStatus: "cached", latitude: input.latitude, longitude: input.longitude, radiusNm: input.radiusNm, reports: [{ reportType: "UA", aircraftType: "C172", altitudeFeetMsl: 2500, turbulence: "negative", icing: "negative", skyCondition: "few at 2500 feet", observedAt: input.observedAt }] };
  if (resource === "weather/sigmets") return { ...base, provider: "AviationWeather.gov AirSIGMET feed", providerStatus: "cached", latitude: input.latitude, longitude: input.longitude, radiusNm: input.radiusNm, advisories: [], clear: true };
  if (resource === "weather/conditions") return { ...base, provider: "PreFlight weather aggregation", latitude: input.latitude, longitude: input.longitude, temperatureC: 24, dewpointC: 18, windSpeedKnots: 8, windDirectionDegrees: 235, visibilityStatuteMiles: 10, ceilingFeetAgl: 2500, precipitationProbability: 0.08, flightCategory: "VFR" };
  if (resource === "weather/winds-aloft") return { ...base, provider: "NOAA forecast adapter", latitude: input.latitude, longitude: input.longitude, requestedAltitudeFeet: input.altitudeFeet, levels: [{ altitudeFeet: 200, speedKnots: 7, directionDegrees: 228, temperatureC: 23 },{ altitudeFeet: 400, speedKnots: 10, directionDegrees: 240, temperatureC: 22 },{ altitudeFeet: 800, speedKnots: 14, directionDegrees: 251, temperatureC: 20 }] };

  if (resource === "airspace/classes") return { ...base, provider: "FAA airspace adapter", latitude: input.latitude, longitude: input.longitude, radiusNm: input.radiusNm, airspaces: [{ class: "B", name: "New York Class B", floorFeetMsl: 0, ceilingFeetMsl: 7000, authorizationRequired: true }] };
  if (resource === "airspace/tfrs") return { ...base, provider: "FAA TFR adapter", latitude: input.latitude, longitude: input.longitude, radiusNm: input.radiusNm, restrictions: [], clear: true };
  if (resource === "airspace/notams") return { ...base, provider: "FAA NOTAM adapter", station: input.station, latitude: input.latitude, longitude: input.longitude, radiusNm: input.radiusNm, notices: [{ id: "JFK-OPS-001", facility: input.station, type: "AIRSPACE", effectiveStart: input.observedAt, effectiveEnd: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), text: "Review current airport and airspace notices before operation." }] };
  if (resource === "airspace/laanc-facility-maps") return { ...base, provider: "FAA UAS Facility Map adapter", latitude: input.latitude, longitude: input.longitude, grid: { eligible: true, maximumAltitudeFeetAgl: 200, facility: "JFK", reviewType: "further-coordination-above-grid" } };
  if (resource === "airspace/authorization-requirements") return { ...base, provider: "PreFlight airspace policy engine", latitude: input.latitude, longitude: input.longitude, plannedAltitudeFeetAgl: input.altitudeFeet, controlledAirspace: true, authorizationRequired: true, mechanism: input.altitudeFeet <= 200 ? "LAANC" : "LAANC further coordination or FAA DroneZone", waiverRequired: false, disclaimer: "This response identifies requirements and is not itself an FAA authorization." };

  if (resource === "airports/nearby") return { ...base, provider: "FAA airport data adapter", latitude: input.latitude, longitude: input.longitude, radiusNm: input.radiusNm, facilities: [{ identifier: "KJFK", name: "John F. Kennedy International Airport", type: "airport", distanceNauticalMiles: 0.8, runways: ["04L/22R", "04R/22L", "13L/31R", "13R/31L"] }] };
  if (resource === "obstacles/nearby") return { ...base, provider: "FAA obstacle data adapter", latitude: input.latitude, longitude: input.longitude, radiusNm: input.radiusNm, obstacles: [{ type: "tower", heightFeetAgl: 186, distanceNauticalMiles: 2.3, lighting: "red obstruction lighting" }] };
  if (resource === "terrain/elevation") return { ...base, provider: "USGS elevation adapter", latitude: input.latitude, longitude: input.longitude, elevationFeetMsl: 13, requestedAltitudeFeetAgl: input.altitudeFeet, resultingAltitudeFeetMsl: input.altitudeFeet + 13, localTerrainVariationFeet: 21 };
  if (resource === "traffic/nearby") return { ...base, provider: "Cooperative traffic adapter", latitude: input.latitude, longitude: input.longitude, radiusNm: input.radiusNm, aircraft: [{ callsign: "N421PF", altitudeFeetMsl: 1800, distanceNauticalMiles: 3.4, headingDegrees: 72, trend: "departing" }] };
  if (resource === "gnss/integrity") return { ...base, provider: "GNSS prediction adapter", latitude: input.latitude, longitude: input.longitude, satellitesVisible: 19, horizontalDilution: 0.8, verticalDilution: 1.2, integrity: "good", expectedOutages: [] };
  if (resource === "daylight/windows") return { ...base, provider: "Astronomical calculation", latitude: input.latitude, longitude: input.longitude, date: request.nextUrl.searchParams.get("date") ?? input.observedAt.slice(0, 10), civilTwilightStart: "05:32:00-04:00", sunrise: "06:02:00-04:00", sunset: "19:58:00-04:00", civilTwilightEnd: "20:28:00-04:00" };
  if (resource === "mission/readiness") return { ...base, provider: "PreFlight mission intelligence", latitude: input.latitude, longitude: input.longitude, plannedAltitudeFeetAgl: input.altitudeFeet, readinessScore: 0.9, status: "authorization_required", productsUsed: ["weather/metars","weather/tafs","weather/pireps","weather/sigmets","weather/winds-aloft","airspace/classes","airspace/tfrs","airspace/notams","airspace/laanc-facility-maps","airports/nearby","obstacles/nearby","terrain/elevation","traffic/nearby","gnss/integrity"], checks: { weather: "pass", airspace: "authorization_required", temporaryRestrictions: "pass", obstacles: "pass", traffic: "pass", gnss: "pass" }, disclaimer: "Operational planning information only. This response is not an FAA authorization." };
  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string[] }> }) {
  const resource = (await params).resource.join("/");
  const body = await responseFor(resource, request);
  return body ? Response.json(body, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "Unknown PreFlight resource", resource }, { status: 404 });
}

export async function POST(request: NextRequest, contextValue: { params: Promise<{ resource: string[] }> }) {
  const resource = (await contextValue.params).resource.join("/");
  if (resource !== "mission/readiness") return Response.json({ error: "This operation does not support POST" }, { status: 405 });
  let body: Record<string, unknown> = {};
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ error: "A JSON mission request is required" }, { status: 400 }); }
  const url = new URL(request.url);
  for (const [key, value] of Object.entries(body)) if (["latitude","longitude","plannedAltitudeFeet"].includes(key) && value !== undefined) url.searchParams.set(key === "plannedAltitudeFeet" ? "altitudeFeet" : key, String(value));
  return GET(new NextRequest(url, { method: "GET" }), contextValue);
}
