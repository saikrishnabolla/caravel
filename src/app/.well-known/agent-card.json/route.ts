export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return Response.json({
    name: "MissionClear Seller Agent",
    description: "Negotiates and sells agricultural drone mission-readiness packets.",
    url: `${origin}/api/a2a/negotiate`,
    version: "0.1.0",
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["application/json", "text/plain"],
    defaultOutputModes: ["application/json"],
    skills: [{
      id: "mission-readiness-negotiation",
      name: "Negotiate mission-readiness services",
      description: "Volume and seasonal pricing for airspace, weather, compliance, risk, and telemetry coverage.",
      tags: ["agriculture", "drones", "compliance", "telemetry", "commerce"],
      examples: ["Negotiate readiness packets for 100 agricultural missions under $1,500."],
    }],
  });
}
