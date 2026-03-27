import { PLANNING_COLOR } from "@/lib/planningMode";

interface PlanningToggleProps {
  active: boolean;
  onToggle: () => void;
}

export function PlanningToggle({ active, onToggle }: PlanningToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={active ? "Exit planning mode" : "Enter planning mode"}
      title={active ? "Exit planning mode" : "Planning mode"}
      className="w-8 h-8 rounded flex items-center justify-center text-lg leading-none transition-all"
      style={
        active
          ? {
              backgroundColor: `${PLANNING_COLOR}22`,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: PLANNING_COLOR,
              color: PLANNING_COLOR,
            }
          : {
              backgroundColor: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }
      }
    >
      {/* Route/ruler icon — simple SVG */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="3" cy="13" r="1.5" />
        <circle cx="8" cy="5" r="1.5" />
        <circle cx="13" cy="11" r="1.5" />
        <line x1="3" y1="13" x2="8" y2="5" />
        <line x1="8" y1="5" x2="13" y2="11" />
      </svg>
    </button>
  );
}
