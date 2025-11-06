import { Star, Triangle, Circle } from 'lucide-react';

interface MilestoneMarkerProps {
  type: string;
  label: string;
  position: number;
  verticalOffset?: number;
}

export const MilestoneMarker = ({ type, label, position, verticalOffset = 0 }: MilestoneMarkerProps) => {
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
        return <Circle className="h-3 w-3 fill-[hsl(var(--timeline-checkpoint))] text-[hsl(var(--timeline-checkpoint))]" />;
      default:
        return <Circle className="h-3 w-3 fill-[hsl(var(--timeline-milestone))] text-[hsl(var(--timeline-milestone))]" />;
    }
  };

  return (
    <div 
      className="absolute flex flex-col items-center gap-1"
      style={{ 
        left: `${position}%`, 
        top: `${20 + (verticalOffset * 35)}px`,
        transform: 'translateX(-50%)'
      }}
    >
      {getIcon()}
      <span className="text-[10px] text-foreground font-medium text-center max-w-[80px] leading-tight">
        {label}
      </span>
    </div>
  );
};
