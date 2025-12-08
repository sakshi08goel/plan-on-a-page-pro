import { ArrowRight } from "lucide-react";

interface PhaseBarProps {
  label: string;
  startPosition: number;
  endPosition: number;
  verticalOffset?: number;
  color?: "cyan" | "orange";
  rowHeight?: number;
}

export const PhaseBar = ({
  label,
  startPosition,
  endPosition,
  verticalOffset,
  color = "cyan",
}: PhaseBarProps) => {
  const bgColor =
    color === "orange"
      ? "bg-[hsl(var(--accent))]"
      : "bg-[hsl(var(--primary-light))]";

  return (
    <div
      className={`absolute -translate-y-1/2 h-[0.85rem] ${bgColor} rounded flex items-center justify-center text-xs font-medium text-white shadow-sm`}
      style={{
        left: `${startPosition}%`,
        top: verticalOffset ? `${8 + verticalOffset * 50}px` : "8px",
        width: `${endPosition - startPosition}%`,
      }}
    >
      <ArrowRight className="h-3 w-3" /> 
      <span className="truncate px-2">{label}</span>
       <ArrowRight className="h-3 w-3" /> 
    </div>
  );
};
