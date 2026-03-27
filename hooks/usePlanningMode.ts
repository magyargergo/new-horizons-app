import { useState, useRef, useCallback, type RefObject } from "react";
import { MAX_WAYPOINTS, WAYPOINT_HIT_R, type Waypoint } from "@/lib/planningMode";

interface UsePlanningModeOptions {
  /** Ref to the SVG element — used for accurate coordinate conversion via getScreenCTM */
  svgRef: RefObject<SVGSVGElement | null>;
  /** Current zoom level — scales hit radius so tapping feels consistent */
  zoom: number;
}

export function usePlanningMode({ svgRef, zoom }: UsePlanningModeOptions) {
  const [active, setActive] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const waypointsRef = useRef<Waypoint[]>(waypoints);
  waypointsRef.current = waypoints;

  /** Convert client (screen) coordinates to SVG coordinates using the browser's CTM */
  const clientToSvg = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, [svgRef]);

  // Drag state (not in React state to avoid re-renders during RAF)
  const draggingRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  const toggle = useCallback(() => {
    setActive(prev => {
      if (prev) setWaypoints([]); // clear on deactivate
      return !prev;
    });
  }, []);

  /** Find which waypoint index is at the given SVG coords, or -1 */
  const hitTest = useCallback(
    (svgX: number, svgY: number, wps: Waypoint[]): number => {
      const hitR = WAYPOINT_HIT_R / zoom; // scale hit radius by zoom
      for (let i = 0; i < wps.length; i++) {
        const dx = svgX - wps[i].x;
        const dy = svgY - wps[i].y;
        if (dx * dx + dy * dy <= hitR * hitR) return i;
      }
      return -1;
    },
    [zoom]
  );

  // ── Mouse handlers ──

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!active || e.button !== 0) return false;
      const svg = clientToSvg(e.clientX, e.clientY);
      if (!svg) return false;

      // Check synchronously before setState
      const wps = waypointsRef.current;
      const idx = hitTest(svg.x, svg.y, wps);
      if (idx >= 0) {
        draggingRef.current = idx;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        didDragRef.current = false;
        return true; // consumed — dragging a waypoint
      }
      if (wps.length < MAX_WAYPOINTS) {
        setWaypoints(prev => [...prev, { x: svg.x, y: svg.y }]);
        return true; // consumed — placed a waypoint
      }
      return false; // at max capacity, nothing to drag — allow pan
    },
    [active, clientToSvg, hitTest]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingRef.current === null) return false;
      const dx = e.clientX - (dragStartRef.current?.x ?? 0);
      const dy = e.clientY - (dragStartRef.current?.y ?? 0);
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;

      const svg = clientToSvg(e.clientX, e.clientY);
      if (!svg) return false;
      const idx = draggingRef.current;
      setWaypoints(prev => {
        const next = [...prev];
        if (next[idx]) next[idx] = { x: svg.x, y: svg.y };
        return next;
      });
      return true; // consumed
    },
    [clientToSvg]
  );

  const handleMouseUp = useCallback(() => {
    const idx = draggingRef.current;
    if (idx === null) return false;

    if (!didDragRef.current) {
      // Click without drag on existing waypoint → remove it
      setWaypoints(prev => prev.filter((_, i) => i !== idx));
    }

    draggingRef.current = null;
    dragStartRef.current = null;
    didDragRef.current = false;
    return true; // consumed
  }, []);

  // ── Touch handlers ──

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!active || e.touches.length !== 1) return false;
      const t = e.touches[0];
      const svg = clientToSvg(t.clientX, t.clientY);
      if (!svg) return false;

      const wps = waypointsRef.current;
      const idx = hitTest(svg.x, svg.y, wps);
      if (idx >= 0) {
        draggingRef.current = idx;
        dragStartRef.current = { x: t.clientX, y: t.clientY };
        didDragRef.current = false;
        return true;
      }
      if (wps.length < MAX_WAYPOINTS) {
        setWaypoints(prev => [...prev, { x: svg.x, y: svg.y }]);
        return true;
      }
      return false;
    },
    [active, clientToSvg, hitTest]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (draggingRef.current === null || e.touches.length !== 1) return false;
      const t = e.touches[0];
      const dx = t.clientX - (dragStartRef.current?.x ?? 0);
      const dy = t.clientY - (dragStartRef.current?.y ?? 0);
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;

      const svg = clientToSvg(t.clientX, t.clientY);
      if (!svg) return false;
      const idx = draggingRef.current;
      setWaypoints(prev => {
        const next = [...prev];
        if (next[idx]) next[idx] = { x: svg.x, y: svg.y };
        return next;
      });
      return true;
    },
    [clientToSvg]
  );

  const handleTouchEnd = useCallback(() => {
    const idx = draggingRef.current;
    if (idx === null) return false;

    if (!didDragRef.current) {
      setWaypoints(prev => prev.filter((_, i) => i !== idx));
    }

    draggingRef.current = null;
    dragStartRef.current = null;
    didDragRef.current = false;
    return true;
  }, []);

  return {
    active,
    toggle,
    waypoints,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
