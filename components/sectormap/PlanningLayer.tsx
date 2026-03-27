import { PLANNING_COLOR, WAYPOINT_DRAW_R, MAX_WAYPOINTS, segmentDistance, totalDistance, formatTravelTime, type Waypoint } from "@/lib/planningMode";

interface PlanningLayerProps {
  waypoints: Waypoint[];
  /** Current viewBox for scaling labels to stay readable */
  vb: { x: number; y: number; w: number; h: number };
}

interface PlanningTotalBoxProps {
  waypoints: Waypoint[];
}

/** Precomputed curve params per waypoint index — 16 long random curves each */
const WAYPOINT_CURVES: { a1: number; a2: number; cpA: number; cpR: number; op: number }[][] = Array.from({ length: MAX_WAYPOINTS }, (_, i) => {
  let h = (0xdeadbeef + i * 2654435761) >>> 0;
  const next = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return (h >>> 8) / 0xffffff; };
  return Array.from({ length: 16 }, () => ({
    a1: next() * Math.PI * 2,
    a2: next() * Math.PI * 2,
    cpA: next() * Math.PI * 2,
    cpR: 0.2 + next() * 0.6,
    op: 0.15 + next() * 0.25,
  }));
});

export function PlanningLayer({ waypoints, vb }: PlanningLayerProps) {
  if (waypoints.length === 0) return null;

  // Scale factor so text/circles stay a consistent screen size regardless of zoom
  const scale = vb.w / 1200;
  const r = WAYPOINT_DRAW_R * scale;
  const segFontSize = 11 * scale;

  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Segment lines — softer, galaxy-style opacity */}
      {waypoints.map((wp, i) => {
        if (i === 0) return null;
        const prev = waypoints[i - 1];
        return (
          <g key={`seg-${i}`}>
            {/* Soft glow line behind */}
            <line
              x1={prev.x} y1={prev.y}
              x2={wp.x} y2={wp.y}
              stroke={PLANNING_COLOR}
              strokeWidth={5 * scale}
              opacity={0.08}
              strokeLinecap="round"
            />
            {/* Main dashed line */}
            <line
              x1={prev.x} y1={prev.y}
              x2={wp.x} y2={wp.y}
              stroke={PLANNING_COLOR}
              strokeWidth={1.2 * scale}
              strokeDasharray={`${6 * scale} ${4 * scale}`}
              opacity={0.6}
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* Segment time labels */}
      {waypoints.map((wp, i) => {
        if (i === 0) return null;
        const prev = waypoints[i - 1];
        const mx = (prev.x + wp.x) / 2;
        const my = (prev.y + wp.y) / 2;
        const dist = segmentDistance(prev, wp);
        const dx = wp.x - prev.x;
        const dy = wp.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = len > 0 ? -dy / len : 0;
        const ny = len > 0 ? dx / len : -1;
        const off = 18 * scale;
        // Angle of the line in degrees, flipped if upside-down so text stays readable
        let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angleDeg > 90) angleDeg -= 180;
        else if (angleDeg < -90) angleDeg += 180;
        return (
          <text
            key={`dist-${i}`}
            x={mx + nx * off}
            y={my + ny * off}
            textAnchor="middle"
            dominantBaseline="central"
            fill={PLANNING_COLOR}
            fontSize={segFontSize}
            fontFamily="var(--font-geist-sans), sans-serif"
            fontWeight={600}
            opacity={0.85}
            transform={`rotate(${angleDeg} ${mx + nx * off} ${my + ny * off})`}
          >
            {formatTravelTime(dist)}
          </text>
        );
      })}

      {/* Waypoint markers */}
      {waypoints.map((wp, i) => {
        const outerR = r * 2.2;

        return (
          <g key={`wp-${i}`}>
            {/* Thin outer border circle */}
            <circle
              cx={wp.x} cy={wp.y} r={outerR}
              fill="none"
              stroke={PLANNING_COLOR}
              strokeWidth={0.5 * scale}
              strokeOpacity={0.5}
            />

            {/* Decorative curves — four arcs spaced around the border */}
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, j) => {
              const arcR = outerR + 3 * scale;
              const span = 0.5;
              const x1 = wp.x + arcR * Math.cos(a - span);
              const y1 = wp.y + arcR * Math.sin(a - span);
              const x2 = wp.x + arcR * Math.cos(a + span);
              const y2 = wp.y + arcR * Math.sin(a + span);
              const cpR = arcR + 4 * scale;
              const cpx = wp.x + cpR * Math.cos(a);
              const cpy = wp.y + cpR * Math.sin(a);
              return (
                <path
                  key={j}
                  d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
                  fill="none"
                  stroke={PLANNING_COLOR}
                  strokeWidth={0.6 * scale}
                  strokeOpacity={0.35}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Long random curves connecting core to outer ring */}
            {WAYPOINT_CURVES[i].map((c, j) => {
              const x1 = wp.x + r * Math.cos(c.a1);
              const y1 = wp.y + r * Math.sin(c.a1);
              const x2 = wp.x + outerR * Math.cos(c.a2);
              const y2 = wp.y + outerR * Math.sin(c.a2);
              const cpx = wp.x + (r + (outerR - r) * c.cpR) * Math.cos(c.cpA);
              const cpy = wp.y + (r + (outerR - r) * c.cpR) * Math.sin(c.cpA);
              return (
                <path
                  key={j}
                  d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
                  fill="none"
                  stroke={PLANNING_COLOR}
                  strokeWidth={0.5 * scale}
                  strokeOpacity={c.op}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Radial gradient for soft-edged core */}
            <defs>
              <radialGradient id={`wp-glow-${i}`}>
                <stop offset="0%" stopColor={PLANNING_COLOR} stopOpacity={0.95} />
                <stop offset="55%" stopColor={PLANNING_COLOR} stopOpacity={0.85} />
                <stop offset="100%" stopColor={PLANNING_COLOR} stopOpacity={0} />
              </radialGradient>
            </defs>
            {/* Soft-edged glowing core */}
            <circle
              cx={wp.x} cy={wp.y} r={r * 1.3}
              fill={`url(#wp-glow-${i})`}
              stroke="none"
            />

            {/* Number label — black for contrast on bright core */}
            <text
              x={wp.x}
              y={wp.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#0c0c14"
              fontSize={r * 1.3}
              fontFamily="var(--font-cinzel), serif"
              fontWeight={700}
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Total box is rendered as HTML overlay in PlanningTotalBox */}
    </g>
  );
}

/** HTML overlay for the total distance/time box — flush with top border of the canvas */
export function PlanningTotalBox({ waypoints }: PlanningTotalBoxProps) {
  if (waypoints.length < 2) return null;
  const total = totalDistance(waypoints);
  const time = formatTravelTime(total);
  const c = PLANNING_COLOR;

  return (
    <div
      className="absolute top-1 left-3 z-10 pointer-events-none select-none"
      style={{ fontFamily: "var(--font-cinzel), serif" }}
    >
      <div
        className="relative overflow-visible"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          borderLeft: `1px solid ${c}30`,
          borderRight: `1px solid ${c}30`,
          borderBottom: `1px solid ${c}30`,
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          padding: "10px 24px 14px",
          minWidth: 160,
        }}
      >
        {/* Corner dots */}
        <div
          className="absolute bottom-1.5 left-1.5 rounded-full"
          style={{ width: 3, height: 3, background: c, opacity: 0.4 }}
        />
        <div
          className="absolute bottom-1.5 right-1.5 rounded-full"
          style={{ width: 3, height: 3, background: c, opacity: 0.4 }}
        />
        {/* Bottom edge glow line */}
        <div
          className="absolute bottom-0 left-2 right-2 h-px"
          style={{ background: c, opacity: 0.15 }}
        />

        {/* Outer glow border */}
        <div
          className="absolute inset-0 rounded-b-lg"
          style={{
            boxShadow: `0 0 8px ${c}15, inset 0 0 8px ${c}08`,
            borderRadius: "0 0 8px 8px",
            pointerEvents: "none",
          }}
        />

        {/* Time — primary */}
        <div
          className="text-center leading-none"
          style={{
            color: c,
            fontSize: 28,
            fontWeight: 700,
            opacity: 0.9,
            textShadow: `0 0 12px ${c}40`,
          }}
        >
          {time}
        </div>

        {/* Units — secondary */}
        <div
          className="text-center leading-none mt-1.5"
          style={{
            color: c,
            fontSize: 14,
            fontWeight: 500,
            opacity: 0.45,
            fontFamily: "var(--font-geist-sans), sans-serif",
          }}
        >
          Σ {total}u
        </div>
      </div>
    </div>
  );
}
