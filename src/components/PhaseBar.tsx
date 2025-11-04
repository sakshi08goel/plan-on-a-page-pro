import { ArrowRight } from 'lucide-react';

interface PhaseBarProps {
  label: string;
  startPosition: number;
  endPosition: number;
  color?: 'cyan' | 'orange';
}

export const PhaseBar = ({ label, startPosition, endPosition, color = 'cyan' }: PhaseBarProps) => {
  const bgColor = color === 'orange' ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary-light))]';
  
  return (
    <div 
      className={`absolute top-1/2 -translate-y-1/2 h-8 ${bgColor} rounded flex items-center justify-center text-xs font-medium text-white shadow-sm`}
      style={{ 
        left: `${startPosition}%`, 
        width: `${endPosition - startPosition}%` 
      }}
    >
      <ArrowRight className="h-3 w-3 absolute -left-2" />
      <span className="truncate px-2">{label}</span>
      <ArrowRight className="h-3 w-3 absolute -right-2" />
    </div>
  );
};
