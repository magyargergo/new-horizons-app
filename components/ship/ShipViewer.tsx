"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ShipData, ShipBay, ShipLayer } from "@/types/ship";
import ShipSvgLayer from "./ShipSvgLayer";
import ShipBayModal from "./ShipBayModal";

interface ShipViewerProps {
  ship: ShipData;
}

export default function ShipViewer({ ship }: ShipViewerProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedBay, setSelectedBay] = useState<ShipBay | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<ShipLayer | null>(null);
  const [hoveredBay, setHoveredBay] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      // section top hits viewport bottom = 0, section bottom hits viewport top = 1
      const total = section.offsetHeight - viewH;
      if (total <= 0) return;
      const scrolled = -rect.top;
      const progress = Math.min(1, Math.max(0, scrolled / total));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBayClick = useCallback((bay: ShipBay, layer: ShipLayer) => {
    setSelectedBay(bay);
    setSelectedLayer(layer);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedBay(null);
    setSelectedLayer(null);
  }, []);

  // Phase 1 (0-0.5): Rotate from top-down to angled side view
  // Phase 2 (0.4-1): Split layers apart (overlaps with phase 1 for smooth feel)
  const rotateX = Math.min(scrollProgress * 2, 1) * 60;
  const splitPhase = Math.max(0, (scrollProgress - 0.3) / 0.7);
  const layerSpread = splitPhase * 160; // max px between layers

  const totalLayers = ship.layers.length;

  return (
    <>
      {/* Tall section to give us scroll room */}
      <div ref={sectionRef} style={{ height: "300vh", position: "relative" }}>
        {/* Sticky viewport — always visible while scrolling through the section */}
        <div
          className="sticky top-16 flex items-center justify-center overflow-hidden"
          style={{ height: "calc(100dvh - 4rem)", perspective: "1400px" }}
        >
          {/* Ship title — fades out as we scroll */}
          <div
            className="absolute top-8 left-0 right-0 text-center z-10"
            style={{
              opacity: Math.max(0, 1 - scrollProgress * 3),
              transition: "opacity 0.15s ease-out",
            }}
          >
            <p
              className="text-[10px] tracking-[0.5em] text-white/30 uppercase mb-2"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {ship.class}
            </p>
            <h1
              className="text-3xl text-white/80 font-semibold tracking-widest"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {ship.name}
            </h1>
          </div>

          {/* Scroll hint */}
          <div
            className="absolute bottom-8 left-0 right-0 text-center z-10"
            style={{
              opacity: scrollProgress < 0.03 ? 1 : 0,
              transition: "opacity 0.4s ease-out",
            }}
          >
            <p className="text-[10px] tracking-[0.3em] text-white/25 uppercase animate-pulse">
              Scroll to explore decks
            </p>
            <svg
              className="mx-auto mt-2 text-white/20 animate-bounce"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M5 8l5 5 5-5" />
            </svg>
          </div>

          {/* Layer labels — slide in from left when split */}
          <div
            className="absolute left-6 top-0 bottom-0 flex flex-col justify-center z-10 pointer-events-none"
            style={{ gap: `${Math.max(24, layerSpread * 0.6)}px` }}
          >
            {ship.layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center gap-2"
                style={{
                  opacity: splitPhase * 0.8,
                  transform: `translateX(${(1 - splitPhase) * -30}px)`,
                  transition: "opacity 0.15s, transform 0.15s",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <span
                  className="text-[9px] tracking-[0.25em] uppercase whitespace-nowrap"
                  style={{
                    color: layer.color,
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                >
                  {layer.name}
                </span>
              </div>
            ))}
          </div>

          {/* 3D Ship container — rotates on X axis */}
          <div
            className="w-full max-w-3xl px-8"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotateX}deg)`,
            }}
          >
            {/* Layers stacked via relative positioning */}
            <div className="relative" style={{ transformStyle: "preserve-3d" }}>
              {ship.layers.map((layer, i) => {
                // Spread layers vertically from center when splitting
                const offset = (i - (totalLayers - 1) / 2) * layerSpread;
                // Small z separation so top deck is visually in front
                const z = (totalLayers - 1 - i) * 4;

                return (
                  <div
                    key={layer.id}
                    style={{
                      // First layer is in flow, rest are absolute — so they overlap
                      position: i === 0 ? "relative" : "absolute",
                      top: i === 0 ? undefined : 0,
                      left: i === 0 ? undefined : 0,
                      right: i === 0 ? undefined : 0,
                      transform: `translateY(${offset}px) translateZ(${z}px)`,
                    }}
                  >
                    <ShipSvgLayer
                      layer={layer}
                      layerIndex={i}
                      totalLayers={totalLayers}
                      onBayClick={handleBayClick}
                      hoveredBay={hoveredBay}
                      onBayHover={setHoveredBay}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress bar — right edge */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full"
                style={{
                  height: "8px",
                  backgroundColor:
                    i / 20 <= scrollProgress
                      ? "rgba(139, 92, 246, 0.6)"
                      : "rgba(255,255,255,0.1)",
                  transition: "background-color 0.15s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <ShipBayModal
        bay={selectedBay}
        layerName={selectedLayer?.name ?? ""}
        layerColor={selectedLayer?.color ?? "#818CF8"}
        onClose={handleClose}
      />
    </>
  );
}
