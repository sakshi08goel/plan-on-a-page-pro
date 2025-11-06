import { ArrowRight } from 'lucide-react';

interface PhaseBarProps {
  label: string;
  startPosition: number;
  endPosition: number;
  color?: 'cyan' | 'orange';
  verticalOffset?: number;
}

export const PhaseBar = ({ label, startPosition, endPosition, color = 'cyan', verticalOffset = 0 }: PhaseBarProps) => {
  const bgColor = color === 'orange' ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary-light))]';
  
  return (
    <div 
      className={`absolute h-7 ${bgColor} rounded flex items-center justify-center text-xs font-medium text-white shadow-sm z-0`}
      style={{ 
        left: `${startPosition}%`, 
        width: `${endPosition - startPosition}%`,
        bottom: `${10 + (verticalOffset * 35)}px`
      }}
    >
      <ArrowRight className="h-3 w-3 absolute -left-2" />
      <span className="truncate px-2">{label}</span>
      <ArrowRight className="h-3 w-3 absolute -right-2" />
    </div>
  );
};
