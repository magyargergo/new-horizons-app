import { PLANNING_COLOR, WAYPOINT_DRAW_R, segmentDistance, totalDistance, formatTravelTime, type Waypoint } from "@/lib/planningMode";

interface PlanningLayerProps {
  waypoints: Waypoint[];
  /** Current viewBox for scaling labels to stay readable */
  vb: { x: number; y: number; w: number; h: number };
}

interface PlanningTotalBoxProps {
  waypoints: Waypoint[];
}

/** Generate a spiral arm path starting from (cx,cy) curving outward.
 *  `startAngle` in radians, `sweep` controls how far the arm wraps. */
function spiralArm(cx: number, cy: number, r: number, startAngle: number, sweep: number, scale: number): string {
  const r1 = r * 1.6;
  const r2 = r * 2.8;
  const a1 = startAngle + sweep * 0.5;
  const a2 = startAngle + sweep;
  const x0 = cx + r * Math.cos(startAngle) * scale;
  const y0 = cy + r * Math.sin(startAngle) * scale;
  const cpx = cx + r1 * Math.cos(a1) * scale;
  const cpy = cy + r1 * Math.sin(a1) * scale;
  const ex = cx + r2 * Math.cos(a2) * scale;
  const ey = cy + r2 * Math.sin(a2) * scale;
  return `M ${x0} ${y0} Q ${cpx} ${cpy} ${ex} ${ey}`;
}


export function PlanningLayer({ waypoints, vb }: PlanningLayerProps) {
  if (waypoints.length === 0) return null;

  // Scale factor so text/circles stay a consistent screen size regardless of zoom
  const scale = vb.w / 1200;
  const r = WAYPOINT_DRAW_R * scale;
  const fontSize = 12 * scale;
  const segFontSize = 11 * scale;
  const labelOffset = r + 8 * scale;

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
        const off = 10 * scale;
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
          >
            {formatTravelTime(dist)}
          </text>
        );
      })}

      {/* Waypoint markers — galaxy-core style with spiral arms */}
      {waypoints.map((wp, i) => {
        // Direction angle: point spiral arms along route direction
        const next = waypoints[i + 1];
        const prev = waypoints[i - 1];
        let angle = 0;
        if (next) angle = Math.atan2(next.y - wp.y, next.x - wp.x);
        else if (prev) angle = Math.atan2(wp.y - prev.y, wp.x - prev.x);

        return (
          <g key={`wp-${i}`}>
            {/* Outer halo */}
            <circle
              cx={wp.x} cy={wp.y} r={r * 2.2}
              fill="none"
              stroke={PLANNING_COLOR}
              strokeWidth={0.5 * scale}
              opacity={0.2}
            />
            {/* Mid halo */}
            <circle
              cx={wp.x} cy={wp.y} r={r * 1.6}
              fill="none"
              stroke={PLANNING_COLOR}
              strokeWidth={0.6 * scale}
              opacity={0.3}
            />
            {/* Glow fill */}
            <circle
              cx={wp.x} cy={wp.y} r={r * 1.2}
              fill={PLANNING_COLOR}
              fillOpacity={0.08}
              stroke="none"
            />
            {/* Core ring */}
            <circle
              cx={wp.x} cy={wp.y} r={r}
              fill={PLANNING_COLOR}
              fillOpacity={0.15}
              stroke={PLANNING_COLOR}
              strokeWidth={0.7 * scale}
              strokeOpacity={0.6}
            />
            {/* Bright core */}
            <circle
              cx={wp.x} cy={wp.y} r={r * 0.45}
              fill={PLANNING_COLOR}
              fillOpacity={0.5}
              stroke="none"
            />
            {/* Inner core dot */}
            <circle
              cx={wp.x} cy={wp.y} r={r * 0.2}
              fill={PLANNING_COLOR}
              fillOpacity={0.8}
              stroke="none"
            />

            {/* Spiral arms — two opposing slingshot curves */}
            <path
              d={spiralArm(wp.x, wp.y, r, angle - 0.3, 2.2, 1)}
              fill="none"
              stroke={PLANNING_COLOR}
              strokeWidth={0.8 * scale}
              strokeOpacity={0.45}
              strokeLinecap="round"
            />
            <path
              d={spiralArm(wp.x, wp.y, r, angle - 0.3, 2.2, 1)}
              fill="none"
              stroke={PLANNING_COLOR}
              strokeWidth={3 * scale}
              strokeOpacity={0.06}
              strokeLinecap="round"
            />
            <path
              d={spiralArm(wp.x, wp.y, r, angle + Math.PI - 0.3, 2.2, 1)}
              fill="none"
              stroke={PLANNING_COLOR}
              strokeWidth={0.8 * scale}
              strokeOpacity={0.45}
              strokeLinecap="round"
            />
            <path
              d={spiralArm(wp.x, wp.y, r, angle + Math.PI - 0.3, 2.2, 1)}
              fill="none"
              stroke={PLANNING_COLOR}
              strokeWidth={3 * scale}
              strokeOpacity={0.06}
              strokeLinecap="round"
            />

            {/* Number label */}
            <text
              x={wp.x}
              y={wp.y - labelOffset}
              textAnchor="middle"
              dominantBaseline="auto"
              fill={PLANNING_COLOR}
              fontSize={fontSize}
              fontFamily="var(--font-cinzel), serif"
              fontWeight={700}
              opacity={0.9}
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
        {/* Decorative SVG flourishes */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          style={{ pointerEvents: "none" }}
        >
          {/* Bottom-left spiral */}
          <path
            d={`M 4 ${100}% C 4 85%, 15 80%, 20 70%`}
            fill="none" stroke={c} strokeWidth="0.7" strokeOpacity="0.3"
            strokeLinecap="round"
          />
          {/* Bottom-right spiral */}
          <path
            d="M calc(100% - 4) 100% C calc(100% - 4) 85%, calc(100% - 15) 80%, calc(100% - 20) 70%"
            fill="none" stroke={c} strokeWidth="0.7" strokeOpacity="0.3"
            strokeLinecap="round"
          />
          {/* Inner glow line along bottom edge */}
          <line
            x1="8" y1="100%" x2="calc(100% - 8)" y2="100%"
            stroke={c} strokeWidth="0.4" strokeOpacity="0.15"
          />
        </svg>

        {/* Corner dots */}
        <div
          className="absolute bottom-1.5 left-1.5 rounded-full"
          style={{ width: 3, height: 3, background: c, opacity: 0.4 }}
        />
        <div
          className="absolute bottom-1.5 right-1.5 rounded-full"
          style={{ width: 3, height: 3, background: c, opacity: 0.4 }}
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
