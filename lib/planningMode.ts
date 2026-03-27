// ── Planning Mode constants & helpers ──

/** The accent color used for all planning mode UI. Change this single value to restyle. */
export const PLANNING_COLOR = "#38bdf8"; // sky-400

/** Maximum number of waypoints the user can place */
export const MAX_WAYPOINTS = 5;

/** Hit radius (in SVG units) for detecting clicks/taps on a waypoint */
export const WAYPOINT_HIT_R = 16;

/** Visual radius for waypoint circles (SVG units) */
export const WAYPOINT_DRAW_R = 10;

export interface Waypoint {
  x: number;
  y: number;
}

/** Euclidean distance between two points in SVG units, rounded to nearest integer */
export function segmentDistance(a: Waypoint, b: Waypoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

/** Total route distance across all consecutive waypoints */
export function totalDistance(waypoints: Waypoint[]): number {
  let sum = 0;
  for (let i = 1; i < waypoints.length; i++) {
    sum += segmentDistance(waypoints[i - 1], waypoints[i]);
  }
  return sum;
}

// ── Travel time ──

/** Minutes of travel time per 1 SVG unit of distance. Change this to rescale all travel times. */
export const MINUTES_PER_UNIT = 6;

/** Convert a distance in SVG units to a human-readable time string.
 *  e.g. 30u → "3h", 800u → "3d 8h", 5u → "30m" */
export function formatTravelTime(distance: number, minutesPerUnit = MINUTES_PER_UNIT): string {
  const totalMinutes = Math.round(distance * minutesPerUnit);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const mins = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 && days === 0) parts.push(`${mins}m`); // skip minutes when showing days for brevity
  return parts.join(" ") || "0m";
}
