type Method = "get" | "post";

type Operation = {
  method?: Method;
  operationId: string;
  summary: string;
  description: string;
  tag: string;
  price: string;
  unit?: string;
  parameters?: string[];
};

const coordinateParameters = ["latitude", "longitude"];
const areaParameters = ["latitude", "longitude", "radiusNm"];

const operations: Record<string, Operation> = {
  "/api/preflight/weather/metars": { operationId: "getMetars", summary: "METAR observations", description: "Returns decoded and raw aviation weather observations for one or more ICAO stations.", tag: "Aviation weather", price: "0.01", parameters: ["station"] },
  "/api/preflight/weather/tafs": { operationId: "getTafs", summary: "TAF forecasts", description: "Returns terminal aerodrome forecasts with forecast periods, winds, visibility, and cloud conditions.", tag: "Aviation weather", price: "0.015", parameters: ["station"] },
  "/api/preflight/weather/pireps": { operationId: "getPireps", summary: "Pilot reports", description: "Returns pilot reports near an operating area, including turbulence, icing, cloud, and visibility observations.", tag: "Aviation weather", price: "0.02", parameters: areaParameters },
  "/api/preflight/weather/sigmets": { operationId: "getSigmets", summary: "SIGMET advisories", description: "Returns active significant meteorological advisories intersecting the requested operating area.", tag: "Aviation weather", price: "0.02", parameters: areaParameters },
  "/api/preflight/weather/conditions": { operationId: "getWeatherConditions", summary: "Surface weather conditions", description: "Returns current temperature, wind, visibility, precipitation, ceiling, and flight category for a coordinate.", tag: "Aviation weather", price: "0.02", parameters: coordinateParameters },
  "/api/preflight/weather/winds-aloft": { operationId: "getWindsAloft", summary: "Winds aloft", description: "Returns forecast wind speed, direction, and temperature at multiple operating altitudes.", tag: "Aviation weather", price: "0.03", parameters: [...coordinateParameters, "altitudeFeet"] },
  "/api/preflight/airspace/classes": { operationId: "getAirspaceClasses", summary: "Airspace classes", description: "Returns controlled and special-use airspace intersecting the requested area, including floor and ceiling limits.", tag: "FAA and airspace", price: "0.025", parameters: areaParameters },
  "/api/preflight/airspace/tfrs": { operationId: "getTemporaryFlightRestrictions", summary: "Temporary flight restrictions", description: "Returns active and scheduled temporary flight restrictions near the requested operation.", tag: "FAA and airspace", price: "0.025", parameters: areaParameters },
  "/api/preflight/airspace/notams": { operationId: "getNotams", summary: "NOTAMs", description: "Returns notices to air missions affecting airports, navigation facilities, airspace, or hazards near the operation.", tag: "FAA and airspace", price: "0.03", parameters: [...areaParameters, "station"] },
  "/api/preflight/airspace/laanc-facility-maps": { operationId: "getLaancFacilityMaps", summary: "LAANC facility map limits", description: "Returns UAS facility map grid limits and the maximum altitude eligible for automated authorization review.", tag: "FAA and airspace", price: "0.03", parameters: coordinateParameters },
  "/api/preflight/airspace/authorization-requirements": { operationId: "getAuthorizationRequirements", summary: "Authorization requirements", description: "Determines whether the proposed operation needs LAANC, DroneZone coordination, a waiver, or no airspace authorization.", tag: "FAA and airspace", price: "0.04", parameters: [...coordinateParameters, "altitudeFeet"] },
  "/api/preflight/airports/nearby": { operationId: "getNearbyAirports", summary: "Nearby airports and heliports", description: "Returns airports, heliports, runways, and operational proximity relevant to the mission area.", tag: "Infrastructure", price: "0.015", parameters: areaParameters },
  "/api/preflight/obstacles/nearby": { operationId: "getNearbyObstacles", summary: "Nearby obstacles", description: "Returns towers, buildings, cranes, and other known vertical obstructions near the planned operation.", tag: "Infrastructure", price: "0.02", parameters: areaParameters },
  "/api/preflight/terrain/elevation": { operationId: "getTerrainElevation", summary: "Terrain elevation", description: "Returns ground elevation, route clearance, and terrain variation for the requested coordinate and altitude.", tag: "Infrastructure", price: "0.01", parameters: [...coordinateParameters, "altitudeFeet"] },
  "/api/preflight/traffic/nearby": { operationId: "getNearbyTraffic", summary: "Nearby cooperative traffic", description: "Returns recent cooperative aircraft activity, distance, altitude, heading, and trend near the operation.", tag: "Operational awareness", price: "0.05", parameters: areaParameters },
  "/api/preflight/gnss/integrity": { operationId: "getGnssIntegrity", summary: "GNSS integrity", description: "Returns predicted satellite availability, dilution of precision, reliability, and expected navigation outages.", tag: "Operational awareness", price: "0.02", parameters: [...coordinateParameters, "startTime", "endTime"] },
  "/api/preflight/daylight/windows": { operationId: "getDaylightWindows", summary: "Daylight operating windows", description: "Returns civil twilight, sunrise, sunset, and night-operation windows for the location and date.", tag: "Operational awareness", price: "0.005", parameters: [...coordinateParameters, "date"] },
  "/api/preflight/mission/readiness": { method: "post", operationId: "createMissionReadinessAssessment", summary: "Mission readiness assessment", description: "Combines selected weather, FAA, airspace, terrain, obstacle, traffic, GNSS, and aircraft constraints into one explainable assessment.", tag: "Mission intelligence", price: "0.25", unit: "assessment" },
};

const parameterDefinitions: Record<string, Record<string, unknown>> = {
  latitude: { name: "latitude", in: "query", required: true, description: "Latitude in decimal degrees.", schema: { type: "number", minimum: -90, maximum: 90 }, example: 40.6413 },
  longitude: { name: "longitude", in: "query", required: true, description: "Longitude in decimal degrees.", schema: { type: "number", minimum: -180, maximum: 180 }, example: -73.7781 },
  radiusNm: { name: "radiusNm", in: "query", required: false, description: "Search radius in nautical miles.", schema: { type: "number", minimum: 1, maximum: 100, default: 10 } },
  altitudeFeet: { name: "altitudeFeet", in: "query", required: false, description: "Planned altitude above ground level in feet.", schema: { type: "number", minimum: 0, maximum: 20000, default: 400 } },
  station: { name: "station", in: "query", required: true, description: "ICAO airport or weather station identifier.", schema: { type: "string", pattern: "^[A-Z0-9]{3,4}$" }, example: "KJFK" },
  startTime: { name: "startTime", in: "query", required: false, description: "ISO 8601 mission start time.", schema: { type: "string", format: "date-time" } },
  endTime: { name: "endTime", in: "query", required: false, description: "ISO 8601 mission end time.", schema: { type: "string", format: "date-time" } },
  date: { name: "date", in: "query", required: false, description: "Calendar date for the operating window.", schema: { type: "string", format: "date" } },
};

function responseSchema(operation: Operation) {
  return {
    "200": {
      description: `${operation.summary} response`,
      content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
    },
    "400": { description: "Invalid request parameters" },
    "502": { description: "An upstream data provider was unavailable" },
  };
}

export function createPreflightOpenApi(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "PreFlight Mission Intelligence API",
      version: "1.0.0",
      description: "Granular aviation, weather, airspace, infrastructure, and mission-readiness products that can be sold independently or composed into a complete operational assessment.",
    },
    servers: [{ url: origin, description: "Current PreFlight API deployment" }],
    tags: [
      { name: "Aviation weather", description: "Weather observations, forecasts, pilot reports, advisories, and winds." },
      { name: "FAA and airspace", description: "Airspace classifications, restrictions, notices, facility-map limits, and authorization requirements." },
      { name: "Infrastructure", description: "Airports, obstacles, and terrain data." },
      { name: "Operational awareness", description: "Traffic, GNSS, and operating-window intelligence." },
      { name: "Mission intelligence", description: "Composite assessments built from the granular products." },
    ],
    paths: Object.fromEntries(Object.entries(operations).map(([path, operation]) => {
      const method = operation.method ?? "get";
      return [path, { [method]: {
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        tags: [operation.tag],
        parameters: method === "get" ? (operation.parameters ?? []).map(name => parameterDefinitions[name]) : undefined,
        requestBody: method === "post" ? { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MissionRequest" } } } } : undefined,
        responses: responseSchema(operation),
        "x-raingentic-price": { amount: operation.price, currency: "USD", unit: operation.unit ?? "request" },
        "x-raingentic-source-type": operation.tag === "Aviation weather" ? "aviation-weather-provider" : operation.tag === "FAA and airspace" ? "faa-data-provider" : "preflight-derived-product",
      } }];
    })),
    components: {
      schemas: {
        MissionRequest: {
          type: "object",
          required: ["latitude", "longitude", "plannedAltitudeFeet", "startTime", "endTime"],
          properties: {
            latitude: { type: "number", minimum: -90, maximum: 90 },
            longitude: { type: "number", minimum: -180, maximum: 180 },
            plannedAltitudeFeet: { type: "number", minimum: 0, maximum: 20000 },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            aircraft: { type: "object", additionalProperties: true },
            requiredProducts: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  };
}

