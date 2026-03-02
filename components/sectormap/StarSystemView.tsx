/**
 * Renders a single star system: orbits, star, celestial bodies, special
 * attribute icons, and the active body info card (tooltip).
 *
 * Hover uses proximity-based detection via RAF-throttled mousemove on the
 * scaled system <g>. The tooltip state machine is owned by the parent
 * (SectorMap) via useSvgTooltipTimer and passed down as callbacks.
 */
import { useRef, useCallback } from "react";
import type { SystemPin } from "@/types/sector";
import type { StarSystemMetadata } from "@/types/starsystem";
import type { SvgViewBox } from "@/components/SvgTooltip";
import { SvgTooltip } from "@/components/SvgTooltip";
import { getBodyColors } from "@/lib/bodyColors";
import {
  SYS_SCALE, SYS_MAX_R, FLEET_SHIPS,
  tri, triLeft, asteroidDots, getBodyPos, bodyHitRadius,
} from "@/lib/sectorMapHelpers";

interface BodyTooltipAPI {
  activeId: string | null;
  activeIdRef: React.RefObject<string | null>;
  cardHoveredRef: React.RefObject<boolean>;
  show: (id: string) => void;
  scheduleHide: () => void;
  proximityHide: () => void;
  hideNow: () => void;
  cardEnter: () => void;
  cardLeave: () => void;
}

interface StarSystemViewProps {
  pin: SystemPin;
  sys: StarSystemMetadata | undefined;
  sectorColor: string;
  isActive: boolean;
  isDimmed: boolean;
  noActiveSystem: boolean;
  hoveredSlug: string | null;
  orbitData: { orbitDistances: number[]; maxOrbit: number };
  vb: SvgViewBox;
  bodyTooltip: BodyTooltipAPI;
  onFocusSystem: (pin: SystemPin) => void;
  onHoverSystem: (slug: string | null) => void;
}

export function StarSystemView({
  pin, sys, sectorColor, isActive, isDimmed, noActiveSystem,
  hoveredSlug, orbitData, vb, bodyTooltip,
  onFocusSystem, onHoverSystem,
}: StarSystemViewProps) {
  const { orbitDistances, maxOrbit } = orbitData;
  const labelY = pin.y + (maxOrbit + 30) * SYS_SCALE + 14;
  const activeBodyId = bodyTooltip.activeId;

  // Per-system refs for proximity detection
  const bodyRafRef = useRef<number | null>(null);
  const lastCursorRef = useRef<{ x: number; y: number } | null>(null);

  const findNearestBody = useCallback((
    clientX: number, clientY: number,
    g: SVGGElement, bodies: StarSystemMetadata["bodies"],
  ) => {
    const svg = g.ownerSVGElement;
    if (!svg) return null;
    const ctm = g.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const localPt = pt.matrixTransform(ctm.inverse());
    let nearest: string | null = null;
    let bestRatio = 1;
    for (const body of bodies) {
      const pos = getBodyPos(body.orbitPosition, body.orbitDistance);
      const dx = localPt.x - pos.x;
      const dy = localPt.y - pos.y;
      const ratio = Math.sqrt(dx * dx + dy * dy) / bodyHitRadius(body.type);
      if (ratio < bestRatio) { bestRatio = ratio; nearest = body.id; }
    }
    return nearest;
  }, []);

  const handleBodyProximity = useCallback((e: React.MouseEvent<SVGGElement>) => {
    if (!sys || bodyRafRef.current !== null) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    lastCursorRef.current = { x: clientX, y: clientY };
    const target = e.currentTarget;
    bodyRafRef.current = requestAnimationFrame(() => {
      bodyRafRef.current = null;
      const nearest = findNearestBody(clientX, clientY, target, sys.bodies);
      if (nearest && nearest !== bodyTooltip.activeIdRef.current) {
        bodyTooltip.show(nearest);
      } else if (!nearest && !bodyTooltip.cardHoveredRef.current) {
        bodyTooltip.proximityHide();
      }
    });
  }, [sys, findNearestBody, bodyTooltip]);

  const handleBodyClick = useCallback((e: React.MouseEvent<SVGGElement>) => {
    if (!sys) return;
    const nearest = findNearestBody(e.clientX, e.clientY, e.currentTarget, sys.bodies);
    if (nearest) {
      e.stopPropagation();
      bodyTooltip.show(nearest);
    }
  }, [sys, findNearestBody, bodyTooltip]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<SVGGElement>) => {
    const g = e.currentTarget;
    const cursor = lastCursorRef.current;
    if (cursor) {
      const el = document.elementFromPoint(cursor.x, cursor.y);
      if (el && g.contains(el)) return;
    }
    bodyTooltip.scheduleHide();
  }, [bodyTooltip]);

  return (
    <g
      style={{
        cursor: noActiveSystem ? "pointer" : "default",
        opacity: isDimmed ? 0.2 : 1,
        transition: "opacity 0.3s",
      }}
      onClick={isActive ? (e) => e.stopPropagation() : noActiveSystem ? () => onFocusSystem(pin) : undefined}
      onMouseEnter={noActiveSystem ? () => onHoverSystem(pin.slug) : undefined}
      onMouseLeave={noActiveSystem ? () => onHoverSystem(null) : undefined}
    >
      {/* Hit area — only in overview mode */}
      {noActiveSystem && (
        <circle cx={pin.x} cy={pin.y} r={(maxOrbit + 20) * SYS_SCALE} fill="transparent" />
      )}

      {sys ? (
        <g
          transform={`translate(${pin.x}, ${pin.y}) scale(${SYS_SCALE})`}
          onMouseMove={isActive ? handleBodyProximity : undefined}
          onMouseLeave={isActive ? handleMouseLeave : undefined}
          onClick={isActive ? handleBodyClick : undefined}
        >
          {/* Interaction surface for active system */}
          {isActive && (
            <rect
              x={-SYS_MAX_R - 40} y={-SYS_MAX_R - 40}
              width={(SYS_MAX_R + 40) * 2} height={(SYS_MAX_R + 40) * 2}
              fill="transparent" pointerEvents="all"
            />
          )}

          {/* Orbit rings */}
          {orbitDistances.map((dist) => (
            <circle key={dist} cx={0} cy={0} r={dist * SYS_MAX_R}
              fill="none" stroke="rgba(99,102,241,0.15)"
              strokeWidth="1" strokeDasharray="6 10" />
          ))}

          {/* Star */}
          <circle cx={0} cy={0} r={80} fill={`url(#starCorona-${pin.slug})`}
            style={{ animation: "starPulse 4s ease-in-out infinite" }} />
          <circle cx={0} cy={0} r={40} fill={`url(#starGlow-${pin.slug})`} />
          <circle cx={0} cy={0} r={22} fill={sys.star.color}
            style={{ filter: `drop-shadow(0 0 12px ${sys.star.color})` }} />
          <text x={0} y={55} textAnchor="middle"
            fill={sys.star.color} fontSize="15"
            fontFamily="var(--font-cinzel), serif" fontWeight="600">
            {sys.star.name}
          </text>
          {isActive && sys.star.kankaUrl && (
            <a href={sys.star.kankaUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <text x={0} y={74} textAnchor="middle"
                fill="rgba(165,180,252,0.6)" fontSize="11"
                fontFamily="var(--font-cinzel), serif"
                style={{ cursor: "pointer" }}>
                ↗ Kanka
              </text>
            </a>
          )}

          {/* Pass 1: Body shapes + labels */}
          {sys.bodies.map((body) => {
            const pos = getBodyPos(body.orbitPosition, body.orbitDistance);
            const isBodyActive = isActive && activeBodyId === body.id;
            const { color: bodyColor } = getBodyColors(body);
            const fillId = `url(#body-${pin.slug}-${body.id})`;
            const activeStroke = isBodyActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)";
            const glowStyle = isBodyActive ? { filter: `drop-shadow(0 0 8px ${bodyColor})` } : undefined;
            const labelR =
              body.type === "fleet" ? 22 :
                body.type === "asteroid-field" ? 32 :
                  body.type === "station" ? 10 : 12;
            const highlightR = labelR + 6;

            return (
              <g key={body.id} style={{ cursor: isActive ? "pointer" : "default", pointerEvents: "none" }}>
                {isBodyActive && (
                  <circle cx={pos.x} cy={pos.y} r={highlightR}
                    fill="none" stroke={bodyColor} strokeWidth="1.5" strokeOpacity="0.6"
                    style={{ filter: `drop-shadow(0 0 6px ${bodyColor})` }}>
                    <animate attributeName="r" values={`${highlightR};${highlightR + 4};${highlightR}`} dur="2s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {body.type === "station" && (
                  <polygon
                    points={`${pos.x},${pos.y - 10} ${pos.x + 9},${pos.y} ${pos.x},${pos.y + 10} ${pos.x - 9},${pos.y}`}
                    fill={fillId}
                    stroke={isBodyActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"}
                    strokeWidth={isBodyActive ? "2" : "1"} style={glowStyle}
                  />
                )}

                {body.type === "ship" && (
                  <polygon points={tri(pos.x, pos.y, 10)}
                    fill={fillId} stroke={activeStroke}
                    strokeWidth={isBodyActive ? "2" : "0.8"} style={glowStyle} />
                )}

                {body.type === "fleet" && (
                  <g style={glowStyle}>
                    {FLEET_SHIPS.map(({ dx, dy, r }, i) => (
                      <polygon key={i} points={triLeft(pos.x + dx, pos.y + dy, r)}
                        fill="url(#fleetGrad)" fillOpacity={0.9}
                        stroke={activeStroke}
                        strokeWidth={isBodyActive ? "1.5" : "0.6"} />
                    ))}
                  </g>
                )}

                {body.type === "asteroid-field" && (
                  <g style={glowStyle}>
                    {asteroidDots(body.id).map((d, i) => (
                      <circle key={i} cx={pos.x + d.x} cy={pos.y + d.y} r={d.r}
                        fill={bodyColor} fillOpacity={0.55 + (i % 5) * 0.08} />
                    ))}
                  </g>
                )}

                {body.type !== "station" && body.type !== "ship" && body.type !== "fleet" && body.type !== "asteroid-field" && (
                  <circle cx={pos.x} cy={pos.y} r={12}
                    fill={fillId} stroke={activeStroke}
                    strokeWidth={isBodyActive ? "2" : "0.5"} style={glowStyle} />
                )}

                {/* Special attribute icons */}
                <SpecialAttributeIcon type={body.special_attribute} posX={pos.x} posY={pos.y} labelR={labelR} />

                <text x={pos.x} y={body.labelPosition === "top" ? pos.y - labelR - 6 : pos.y + labelR + 18}
                  textAnchor="middle"
                  fill={isBodyActive ? "white" : "rgba(255,255,255,0.6)"} fontSize="14"
                  fontFamily="var(--font-cinzel), serif">
                  {body.name}
                </text>
              </g>
            );
          })}

          {/* Pass 2: Active body info card */}
          {isActive && activeBodyId && (() => {
            const body = sys.bodies.find(b => b.id === activeBodyId);
            if (!body) return null;
            const pos = getBodyPos(body.orbitPosition, body.orbitDistance);
            const { color: bodyColor } = getBodyColors(body);
            const cardW = 220;
            const cardH = 50
              + (body.special_attribute ? 20 : 0)
              + (body.kankaUrl ? 34 : 0);
            const bodyR =
              body.type === "fleet" ? 22 :
                body.type === "asteroid-field" ? 32 :
                  body.type === "station" ? 10 : 12;

            return (
              <SvgTooltip
                anchorX={pos.x} anchorY={pos.y}
                cardW={cardW} cardH={cardH}
                color={bodyColor} clearance={bodyR + 16}
                viewBox={vb}
                parentOffsetX={pin.x} parentOffsetY={pin.y}
                scale={SYS_SCALE}
                onMouseEnter={bodyTooltip.cardEnter}
                onMouseLeave={bodyTooltip.cardLeave}
              >
                <div style={{ color: bodyColor, fontSize: "11px", fontWeight: 600, marginBottom: "3px" }}>
                  {body.name}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "9px", marginBottom: body.special_attribute ? "6px" : "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {body.type}{body.biome ? ` · ${body.biome}` : ""}
                </div>
                <SpecialAttributeCardLine type={body.special_attribute} />
                {body.kankaUrl && (
                  <a href={body.kankaUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: "block", marginTop: "8px", padding: "4px 8px",
                    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "4px", color: "rgba(165,180,252,0.9)", fontSize: "9px",
                    textAlign: "center", letterSpacing: "0.08em", textDecoration: "none",
                    textTransform: "uppercase", pointerEvents: "auto",
                  }}>
                    View on Kanka ↗
                  </a>
                )}
              </SvgTooltip>
            );
          })()}
        </g>
      ) : (
        <circle cx={pin.x} cy={pin.y} r={8}
          fill={sectorColor}
          style={{ filter: `drop-shadow(0 0 8px ${sectorColor})` }} />
      )}

      {/* System name label — hidden while system is active */}
      {!isActive && (
        <>
          <text
            x={pin.x} y={labelY} textAnchor="middle"
            fill={hoveredSlug === pin.slug ? "white" : "rgba(255,255,255,0.55)"}
            fontSize="11" fontFamily="var(--font-cinzel), serif"
            style={{ pointerEvents: "none" }}>
            {sys?.name ?? pin.slug}
          </text>
          {sys?.kankaUrl && (
            <a href={sys.kankaUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <text x={pin.x} y={labelY + 16} textAnchor="middle"
                fill="rgba(165,180,252,0.5)" fontSize="9"
                fontFamily="var(--font-cinzel), serif"
                style={{ cursor: "pointer" }}>
                ↗ Kanka
              </text>
            </a>
          )}
        </>
      )}
    </g>
  );
}

// ── Special attribute SVG icon (rendered on the map) ──

function SpecialAttributeIcon({ type, posX, posY, labelR }: {
  type: string | undefined;
  posX: number;
  posY: number;
  labelR: number;
}) {
  if (!type) return null;
  const dx = posX + labelR * 0.85;
  const dy = posY - labelR * 0.85;

  switch (type) {
    case "lathanium": {
      const s = 6;
      return (
        <polygon
          points={`${dx},${dy - s} ${dx + s},${dy} ${dx},${dy + s} ${dx - s},${dy}`}
          fill="#1D4ED8" stroke="#93C5FD" strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 6px #3B82F6)" }} />
      );
    }
    case "nobility": {
      const s = 6;
      return (
        <polygon
          points={`${dx - s},${dy - s * 0.6} ${dx + s},${dy - s * 0.6} ${dx},${dy + s * 0.8}`}
          fill="none" stroke="#FDE047" strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 6px #FDE047)" }} />
      );
    }
    case "purified":
      return (
        <path
          d={`M ${dx} ${dy - 5} L ${dx + 4} ${dy} L ${dx + 2} ${dy + 3} L ${dx - 2} ${dy + 3} L ${dx - 4} ${dy} Z M ${dx + 2} ${dy + 3} L ${dx + 4} ${dy + 7} M ${dx - 2} ${dy + 3} L ${dx - 4} ${dy + 7}`}
          fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px #FFFFFF)" }} />
      );
    case "lightbringer": {
      const o = 6, i = 2.4;
      return (
        <polygon
          points={`${dx + o},${dy} ${dx + i},${dy + i} ${dx},${dy + o} ${dx - i},${dy + i} ${dx - o},${dy} ${dx - i},${dy - i} ${dx},${dy - o} ${dx + i},${dy - i}`}
          fill="#FFE87A" stroke="#FFE87A" strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 6px #FFE87A)" }} />
      );
    }
    case "cult":
      return (
        <path
          d={`M ${dx - 6} ${dy - 6} L ${dx - 6} ${dy + 6} M ${dx + 6} ${dy - 6} L ${dx + 6} ${dy + 6} M ${dx - 6} ${dy - 6} L ${dx + 6} ${dy + 6} M ${dx + 6} ${dy - 6} L ${dx - 6} ${dy + 6}`}
          fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px #B91C1C)" }} />
      );
    case "alien_int":
      return (
        <polygon
          points={`${dx - 8},${dy} ${dx},${dy - 4} ${dx + 8},${dy} ${dx},${dy + 4}`}
          fill="none" stroke="#8B5CF6" strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 6px #8B5CF6)" }} />
      );
    default:
      return null;
  }
}

// ── Special attribute description line (rendered inside tooltip card) ──

function SpecialAttributeCardLine({ type }: { type: string | undefined }) {
  if (!type) return null;

  const ATTRS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    lathanium: {
      icon: <span style={{ display: "inline-block", width: "7px", height: "7px", background: "#1D4ED8", transform: "rotate(45deg)", boxShadow: "0 0 4px #3B82F6", flexShrink: 0 }} />,
      label: "Lathanium resource available",
      color: "#93C5FD",
    },
    nobility: {
      icon: (
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
          <polygon points="0,1 10,1 5,9" fill="none" stroke="#FDE047" strokeWidth="1.5" />
        </svg>
      ),
      label: "Restricted to nobility only",
      color: "#FDE047",
    },
    purified: {
      icon: (
        <svg width="9" height="12" viewBox="-6 -6 12 14" style={{ flexShrink: 0 }}>
          <path d="M 0,-5 L 4,0 L 2,3 L -2,3 L -4,0 Z M 2,3 L 4,7 M -2,3 L -4,7"
            fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 2px #FFFFFF)" }} />
        </svg>
      ),
      label: "This location was purified",
      color: "rgba(255,255,255,0.85)",
    },
    lightbringer: {
      icon: (
        <svg width="9" height="9" viewBox="-6 -6 12 12" style={{ flexShrink: 0 }}>
          <polygon points="5,0 1.4,1.4 0,5 -1.4,1.4 -5,0 -1.4,-1.4 0,-5 1.4,-1.4"
            fill="#FFE87A" stroke="#FFE87A" strokeWidth="0.3"
            style={{ filter: "drop-shadow(0 0 2px #FFE87A)" }} />
        </svg>
      ),
      label: "Lightbringer presence on planet",
      color: "#FFE87A",
    },
    cult: {
      icon: (
        <svg width="9" height="9" viewBox="-7 -7 14 14" style={{ flexShrink: 0 }}>
          <path d="M -6,-6 L -6,6 M 6,-6 L 6,6 M -6,-6 L 6,6 M 6,-6 L -6,6"
            fill="none" stroke="#B91C1C" strokeWidth="1.5" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 2px #B91C1C)" }} />
        </svg>
      ),
      label: "Cultist activity detected",
      color: "#B91C1C",
    },
    alien_int: {
      icon: (
        <svg width="12" height="7" viewBox="-9 -5 18 10" style={{ flexShrink: 0 }}>
          <polygon points="-8,0 0,-4 8,0 0,4"
            fill="none" stroke="#8B5CF6" strokeWidth="1"
            style={{ filter: "drop-shadow(0 0 2px #8B5CF6)" }} />
        </svg>
      ),
      label: "Alien intelligence",
      color: "#8B5CF6",
    },
  };

  const attr = ATTRS[type];
  if (!attr) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
      {attr.icon}
      <span style={{ color: attr.color, fontSize: "9px", letterSpacing: "0.05em" }}>{attr.label}</span>
    </div>
  );
}
