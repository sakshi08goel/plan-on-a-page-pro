import { Star, Triangle, Circle } from 'lucide-react';

interface MilestoneMarkerProps {
  type: string;
  label: string;
  position: number;
}

export const MilestoneMarker = ({ type, label, position }: MilestoneMarkerProps) => {
  const getIcon = () => {
    switch (type.toLowerCase()) {
      case 'key':
      case 'star':
        return <Star className="h-4 w-4 fill-[hsl(var(--timeline-key))] text-[hsl(var(--timeline-key))]" />;
      case 'milestone':
      case 'triangle':
        return <Triangle className="h-4 w-4 fill-[hsl(var(--timeline-milestone))] text-[hsl(var(--timeline-milestone))]" />;
      case 'checkpoint':
      case 'circle':
        return <Circle className="h-3 w-3 fill-[hsl(var(--success))] text-[hsl(var(--success))]" />;
      default:
        return <Circle className="h-3 w-3 fill-[hsl(var(--timeline-milestone))] text-[hsl(var(--timeline-milestone))]" />;
    }
  };

  return (
    <div 
      className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
      style={{ left: `${position}%` }}
    >
      <div className="relative">
        {getIcon()}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-border">
          {label}
        </div>
      </div>
    </div>
  );
};
