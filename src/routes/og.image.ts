import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/og/image" as any)({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url    = new URL(request.url);
        const title  = url.searchParams.get("title") ?? "Orcalis Assess";
        const sub    = url.searchParams.get("sub")   ?? "Enterprise AI-Powered Examination Platform";

        const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1b4b"/>
      <stop offset="100%" style="stop-color:#312e81"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Grid pattern -->
  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Accent bar -->
  <rect x="80" y="160" width="6" height="200" rx="3" fill="url(#accent)"/>

  <!-- Shield icon area -->
  <rect x="80" y="80" width="64" height="64" rx="16" fill="url(#accent)"/>
  <text x="112" y="120" font-family="system-ui" font-size="32" fill="white" text-anchor="middle">🛡</text>

  <!-- Brand name -->
  <text x="162" y="107" font-family="system-ui, -apple-system, sans-serif" font-size="22"
    font-weight="600" fill="rgba(255,255,255,0.7)" letter-spacing="0.5">Orcalis Assess</text>

  <!-- Title -->
  <text x="105" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="64"
    font-weight="800" fill="white">${title.length > 28 ? title.slice(0, 28) + "…" : title}</text>

  <!-- Subtitle -->
  <text x="105" y="295" font-family="system-ui, -apple-system, sans-serif" font-size="28"
    fill="rgba(255,255,255,0.6)">${sub.length > 55 ? sub.slice(0, 55) + "…" : sub}</text>

  <!-- Feature pills -->
  ${[
    { x: 105, label: "AI Proctoring" },
    { x: 280, label: "Real-time Analytics" },
    { x: 510, label: "GDPR Compliant" },
    { x: 710, label: "SOC 2 Type II" },
  ].map(({ x, label }) => `
  <rect x="${x}" y="360" width="${label.length * 11 + 32}" height="42" rx="21"
    fill="rgba(99,102,241,0.3)" stroke="rgba(99,102,241,0.6)" stroke-width="1.5"/>
  <text x="${x + label.length * 5.5 + 16}" y="386" font-family="system-ui" font-size="16"
    fill="rgba(255,255,255,0.9)" text-anchor="middle">${label}</text>`).join("")}

  <!-- Bottom bar -->
  <rect x="0" y="570" width="1200" height="60" fill="rgba(0,0,0,0.3)"/>
  <text x="80" y="605" font-family="system-ui" font-size="16" fill="rgba(255,255,255,0.5)">
    assess.orcalis.io
  </text>
  <text x="1120" y="605" font-family="system-ui" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="end">
    Trusted by 500+ institutions
  </text>
</svg>`;

        return new Response(svg, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        });
      },
    },
  },
});
