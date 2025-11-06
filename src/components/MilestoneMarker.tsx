import { Star, Triangle, Circle } from 'lucide-react';

interface MilestoneMarkerProps {
  type: string;
  label: string;
  position: number;
  verticalOffset?: number;
}

export const MilestoneMarker = ({ type, label, position, verticalOffset = 0 }: MilestoneMarkerProps) => {
  const getIcon = () => {
    const lowerType = type.toLowerCase();
    
    // Customer Go Live -> Star
    if (lowerType.includes('customer') && lowerType.includes('go') && lowerType.includes('live')) {
      return <Star className="h-4 w-4 fill-[hsl(var(--timeline-key))] text-[hsl(var(--timeline-key))]" />;
    }
    
    // Tech Drop -> Triangle
    if (lowerType.includes('tech') && lowerType.includes('drop')) {
      return <Triangle className="h-4 w-4 fill-[hsl(var(--timeline-milestone))] text-[hsl(var(--timeline-milestone))]" />;
    }
    
    switch (lowerType) {
      case 'key':
      case 'star':
        return <Star className="h-4 w-4 fill-[hsl(var(--timeline-key))] text-[hsl(var(--timeline-key))]" />;
      case 'milestone':
      case 'triangle':
      case 'techdrop':
        return <Triangle className="h-4 w-4 fill-[hsl(var(--timeline-milestone))] text-[hsl(var(--timeline-milestone))]" />;
      case 'checkpoint':
      case 'circle':
        return <Circle className="h-3 w-3 fill-[hsl(var(--timeline-checkpoint))] text-[hsl(var(--timeline-checkpoint))]" />;
      default:
        return <Circle className="h-3 w-3 fill-[hsl(var(--timeline-checkpoint))] text-[hsl(var(--timeline-checkpoint))]" />;
    }
  };

  return (
    <div 
      className="absolute flex flex-col items-center gap-1 z-10"
      style={{ 
        left: `${position}%`, 
        top: `${15 + (verticalOffset * 40)}px`,
        transform: 'translateX(-50%)'
      }}
    >
      {getIcon()}
      <span className="text-[10px] text-foreground font-medium text-center max-w-[100px] leading-tight whitespace-normal break-words">
        {label}
      </span>
    </div>
  );
};
