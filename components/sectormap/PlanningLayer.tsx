import { PLANNING_COLOR, WAYPOINT_DRAW_R, segmentDistance, totalDistance, formatTravelTime, type Waypoint } from "@/lib/planningMode";

interface PlanningLayerProps {
  waypoints: Waypoint[];
  /** Current viewBox for scaling labels to stay readable */
  vb: { x: number; y: number; w: number; h: number };
}

export function PlanningLayer({ waypoints, vb }: PlanningLayerProps) {
  if (waypoints.length === 0) return null;

  // Scale factor so text/circles stay a consistent screen size regardless of zoom
  const scale = vb.w / 1200;
  const r = WAYPOINT_DRAW_R * scale;
  const fontSize = 12 * scale;
  const segFontSize = 11 * scale;
  const labelOffset = r + 6 * scale;

  return (
    <g style={{ pointerEvents: "none" }}>
      {/* Segment lines */}
      {waypoints.map((wp, i) => {
        if (i === 0) return null;
        const prev = waypoints[i - 1];
        return (
          <line
            key={`seg-${i}`}
            x1={prev.x} y1={prev.y}
            x2={wp.x} y2={wp.y}
            stroke={PLANNING_COLOR}
            strokeWidth={2 * scale}
            strokeDasharray={`${6 * scale} ${4 * scale}`}
            opacity={0.7}
          />
        );
      })}

      {/* Segment distance labels */}
      {waypoints.map((wp, i) => {
        if (i === 0) return null;
        const prev = waypoints[i - 1];
        const mx = (prev.x + wp.x) / 2;
        const my = (prev.y + wp.y) / 2;
        const dist = segmentDistance(prev, wp);
        // Offset label slightly perpendicular to the line
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
            opacity={0.9}
          >
            {formatTravelTime(dist)}
          </text>
        );
      })}

      {/* Waypoint circles + labels */}
      {waypoints.map((wp, i) => (
        <g key={`wp-${i}`}>
          <circle
            cx={wp.x} cy={wp.y} r={r}
            fill={PLANNING_COLOR}
            fillOpacity={0.25}
            stroke={PLANNING_COLOR}
            strokeWidth={2 * scale}
          />
          <text
            x={wp.x}
            y={wp.y - labelOffset}
            textAnchor="middle"
            dominantBaseline="auto"
            fill={PLANNING_COLOR}
            fontSize={fontSize}
            fontFamily="var(--font-cinzel), serif"
            fontWeight={700}
          >
            {i + 1}
          </text>
        </g>
      ))}

      {/* Total box — top-left of current viewport, shown when 2+ points */}
      {waypoints.length >= 2 && (() => {
        const total = totalDistance(waypoints);
        return (
          <g>
            <rect
              x={vb.x + 10 * scale}
              y={vb.y + 10 * scale}
              width={140 * scale}
              height={44 * scale}
              rx={6 * scale}
              fill="rgba(0,0,0,0.6)"
              stroke={PLANNING_COLOR}
              strokeWidth={1.5 * scale}
            />
            <text
              x={vb.x + 80 * scale}
              y={vb.y + 26 * scale}
              textAnchor="middle"
              dominantBaseline="central"
              fill={PLANNING_COLOR}
              fontSize={14 * scale}
              fontFamily="var(--font-geist-sans), sans-serif"
              fontWeight={700}
            >
              {formatTravelTime(total)}
            </text>
            <text
              x={vb.x + 80 * scale}
              y={vb.y + 42 * scale}
              textAnchor="middle"
              dominantBaseline="central"
              fill={PLANNING_COLOR}
              fontSize={11 * scale}
              fontFamily="var(--font-geist-sans), sans-serif"
              fontWeight={500}
              opacity={0.75}
            >
              Σ {total}u
            </text>
          </g>
        );
      })()}
    </g>
  );
}
