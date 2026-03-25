"use client";

import type { ShipLayer, ShipBay } from "@/types/ship";

interface ShipSvgLayerProps {
  layer: ShipLayer;
  layerIndex: number;
  totalLayers: number;
  onBayClick: (bay: ShipBay, layer: ShipLayer) => void;
  hoveredBay: string | null;
  onBayHover: (bayId: string | null) => void;
}

/**
 * Each layer is a horizontal cross-section slice of the ship.
 * Layer 0 = Command Deck (top, narrowest dorsal spine)
 * Layer 1 = Main Deck (wider, wing roots)
 * Layer 2 = Engineering Deck (widest, full beam — unchanged)
 * Layer 3 = Cargo Hold (bottom, tapers under)
 */

function getHullGeometry(layerIndex: number, W: number, H: number) {
  switch (layerIndex) {
    // Command Deck — narrow dorsal spine with a sharp prow
    case 0: {
      const yMid = H * 0.5;
      const yTop = H * 0.28;
      const yBot = H * 0.72;
      return {
        hull: `
          M ${W * 0.06} ${yMid}
          Q ${W * 0.1} ${yTop}, ${W * 0.3} ${H * 0.3}
          Q ${W * 0.5} ${H * 0.2}, ${W * 0.72} ${H * 0.28}
          Q ${W * 0.84} ${H * 0.32}, ${W * 0.92} ${H * 0.42}
          L ${W * 0.95} ${yMid}
          L ${W * 0.92} ${H * 0.58}
          Q ${W * 0.84} ${H * 0.68}, ${W * 0.72} ${H * 0.72}
          Q ${W * 0.5} ${H * 0.8}, ${W * 0.3} ${H * 0.7}
          Q ${W * 0.1} ${yBot}, ${W * 0.06} ${yMid}
          Z
        `,
        wingTop: `
          M ${W * 0.22} ${H * 0.34}
          Q ${W * 0.18} ${H * 0.2}, ${W * 0.14} ${H * 0.18}
          L ${W * 0.17} ${H * 0.3}
          Z
        `,
        wingBot: `
          M ${W * 0.22} ${H * 0.66}
          Q ${W * 0.18} ${H * 0.8}, ${W * 0.14} ${H * 0.82}
          L ${W * 0.17} ${H * 0.7}
          Z
        `,
        // Dorsal antenna/fin detail
        extras: [
          {
            type: "line" as const,
            x1: W * 0.75,
            y1: yMid,
            x2: W * 0.93,
            y2: yMid,
          },
        ],
      };
    }

    // Main Deck — wider with visible wing roots
    case 1: {
      return {
        hull: `
          M ${W * 0.04} ${H * 0.5}
          Q ${W * 0.07} ${H * 0.2}, ${W * 0.27} ${H * 0.22}
          Q ${W * 0.47} ${H * 0.1}, ${W * 0.7} ${H * 0.18}
          Q ${W * 0.83} ${H * 0.22}, ${W * 0.94} ${H * 0.38}
          L ${W * 0.97} ${H * 0.5}
          L ${W * 0.94} ${H * 0.62}
          Q ${W * 0.83} ${H * 0.78}, ${W * 0.7} ${H * 0.82}
          Q ${W * 0.47} ${H * 0.9}, ${W * 0.27} ${H * 0.78}
          Q ${W * 0.07} ${H * 0.8}, ${W * 0.04} ${H * 0.5}
          Z
        `,
        wingTop: `
          M ${W * 0.2} ${H * 0.26}
          Q ${W * 0.14} ${H * 0.06}, ${W * 0.08} ${H * 0.02}
          L ${W * 0.12} ${H * 0.18}
          Z
        `,
        wingBot: `
          M ${W * 0.2} ${H * 0.74}
          Q ${W * 0.14} ${H * 0.94}, ${W * 0.08} ${H * 0.98}
          L ${W * 0.12} ${H * 0.82}
          Z
        `,
        extras: [],
      };
    }

    // Engineering Deck — widest, full beam with big wings (original shape)
    case 2: {
      return {
        hull: `
          M ${W * 0.02} ${H * 0.5}
          Q ${W * 0.05} ${H * 0.15}, ${W * 0.25} ${H * 0.18}
          Q ${W * 0.45} ${H * 0.05}, ${W * 0.7} ${H * 0.15}
          Q ${W * 0.85} ${H * 0.2}, ${W * 0.95} ${H * 0.35}
          L ${W * 0.98} ${H * 0.5}
          L ${W * 0.95} ${H * 0.65}
          Q ${W * 0.85} ${H * 0.8}, ${W * 0.7} ${H * 0.85}
          Q ${W * 0.45} ${H * 0.95}, ${W * 0.25} ${H * 0.82}
          Q ${W * 0.05} ${H * 0.85}, ${W * 0.02} ${H * 0.5}
          Z
        `,
        wingTop: `
          M ${W * 0.2} ${H * 0.22}
          Q ${W * 0.15} ${H * 0.02}, ${W * 0.08} ${H * 0.0}
          L ${W * 0.12} ${H * 0.15}
          Z
        `,
        wingBot: `
          M ${W * 0.2} ${H * 0.78}
          Q ${W * 0.15} ${H * 0.98}, ${W * 0.08} ${H * 1.0}
          L ${W * 0.12} ${H * 0.85}
          Z
        `,
        extras: [],
      };
    }

    // Cargo Hold — bottom, tapers under the engineering deck
    case 3:
    default: {
      return {
        hull: `
          M ${W * 0.05} ${H * 0.5}
          Q ${W * 0.08} ${H * 0.22}, ${W * 0.28} ${H * 0.25}
          Q ${W * 0.48} ${H * 0.14}, ${W * 0.68} ${H * 0.22}
          Q ${W * 0.8} ${H * 0.28}, ${W * 0.9} ${H * 0.4}
          L ${W * 0.93} ${H * 0.5}
          L ${W * 0.9} ${H * 0.6}
          Q ${W * 0.8} ${H * 0.72}, ${W * 0.68} ${H * 0.78}
          Q ${W * 0.48} ${H * 0.86}, ${W * 0.28} ${H * 0.75}
          Q ${W * 0.08} ${H * 0.78}, ${W * 0.05} ${H * 0.5}
          Z
        `,
        wingTop: `
          M ${W * 0.21} ${H * 0.29}
          Q ${W * 0.17} ${H * 0.14}, ${W * 0.12} ${H * 0.1}
          L ${W * 0.15} ${H * 0.24}
          Z
        `,
        wingBot: `
          M ${W * 0.21} ${H * 0.71}
          Q ${W * 0.17} ${H * 0.86}, ${W * 0.12} ${H * 0.9}
          L ${W * 0.15} ${H * 0.76}
          Z
        `,
        // Ventral plating detail lines
        extras: [
          {
            type: "line" as const,
            x1: W * 0.3,
            y1: H * 0.5,
            x2: W * 0.88,
            y2: H * 0.5,
          },
        ],
      };
    }
  }
}

export default function ShipSvgLayer({
  layer,
  layerIndex,
  onBayClick,
  hoveredBay,
  onBayHover,
}: ShipSvgLayerProps) {
  const W = 800;
  const H = 200;

  const { hull: hullPath, wingTop, wingBot, extras } = getHullGeometry(
    layerIndex,
    W,
    H
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      style={{ filter: `drop-shadow(0 0 8px ${layer.color}30)` }}
    >
      <defs>
        <linearGradient id={`hull-${layer.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={layer.color} stopOpacity="0.15" />
          <stop offset="50%" stopColor={layer.color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={layer.color} stopOpacity="0.2" />
        </linearGradient>
        <linearGradient
          id={`hull-stroke-${layer.id}`}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
        >
          <stop offset="0%" stopColor={layer.color} stopOpacity="0.3" />
          <stop offset="50%" stopColor={layer.color} stopOpacity="0.7" />
          <stop offset="100%" stopColor={layer.color} stopOpacity="0.3" />
        </linearGradient>
        {/* Grid pattern for tech look */}
        <pattern
          id={`grid-${layer.id}`}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke={layer.color}
            strokeWidth="0.3"
            strokeOpacity="0.15"
          />
        </pattern>
        <clipPath id={`hull-clip-${layer.id}`}>
          <path d={hullPath} />
        </clipPath>
      </defs>

      {/* Hull fill */}
      <path
        d={hullPath}
        fill={`url(#hull-${layer.id})`}
        stroke={`url(#hull-stroke-${layer.id})`}
        strokeWidth="1.5"
      />

      {/* Grid overlay inside hull */}
      <rect
        x="0"
        y="0"
        width={W}
        height={H}
        fill={`url(#grid-${layer.id})`}
        clipPath={`url(#hull-clip-${layer.id})`}
      />

      {/* Wings */}
      <path
        d={wingTop}
        fill={layer.color}
        fillOpacity="0.1"
        stroke={layer.color}
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />
      <path
        d={wingBot}
        fill={layer.color}
        fillOpacity="0.1"
        stroke={layer.color}
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />

      {/* Extra detail lines per layer */}
      {extras.map((ex, i) =>
        ex.type === "line" ? (
          <line
            key={i}
            x1={ex.x1}
            y1={ex.y1}
            x2={ex.x2}
            y2={ex.y2}
            stroke={layer.color}
            strokeWidth="0.5"
            strokeOpacity="0.15"
            strokeDasharray="6 4"
          />
        ) : null
      )}

      {/* Center line */}
      <line
        x1={W * 0.05}
        y1={H * 0.5}
        x2={W * 0.95}
        y2={H * 0.5}
        stroke={layer.color}
        strokeWidth="0.5"
        strokeOpacity="0.12"
        strokeDasharray="4 8"
      />

      {/* Clickable bays */}
      {layer.bays.map((bay) => {
        const bx = bay.x * W;
        const by = bay.y * H;
        const bw = bay.width * W;
        const bh = bay.height * H;
        const isHovered = hoveredBay === bay.id;

        return (
          <g
            key={bay.id}
            className="cursor-pointer"
            onClick={() => onBayClick(bay, layer)}
            onMouseEnter={() => onBayHover(bay.id)}
            onMouseLeave={() => onBayHover(null)}
          >
            {/* Bay area */}
            <rect
              x={bx}
              y={by}
              width={bw}
              height={bh}
              rx="4"
              fill={layer.color}
              fillOpacity={isHovered ? 0.3 : 0.08}
              stroke={layer.color}
              strokeWidth={isHovered ? 1.5 : 0.8}
              strokeOpacity={isHovered ? 0.9 : 0.4}
              strokeDasharray={isHovered ? "none" : "3 3"}
              style={{ transition: "all 0.2s ease" }}
            />
            {/* Corner accents */}
            {[
              [bx, by],
              [bx + bw, by],
              [bx, by + bh],
              [bx + bw, by + bh],
            ].map(([cx, cy], ci) => (
              <circle
                key={ci}
                cx={cx}
                cy={cy}
                r={isHovered ? 2.5 : 1.5}
                fill={layer.color}
                fillOpacity={isHovered ? 0.9 : 0.5}
                style={{ transition: "all 0.2s ease" }}
              />
            ))}
            {/* Bay label */}
            <text
              x={bx + bw / 2}
              y={by + bh / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fillOpacity={isHovered ? 0.9 : 0.5}
              fontSize="9"
              fontFamily="var(--font-cinzel), serif"
              letterSpacing="0.1em"
              style={{
                textTransform: "uppercase",
                transition: "all 0.2s ease",
                pointerEvents: "none",
              }}
            >
              {bay.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
