import { ArrowRight } from "lucide-react";

interface DependencyArrowProps {
  startPosition: number;
  endPosition: number;
  verticalOffset?: number;
  label: string;
}

export const DependencyArrow = ({
  startPosition,
  endPosition,
  verticalOffset = 0,
  label,
}: DependencyArrowProps) => {
  const width = Math.max(endPosition - startPosition, 5);
  
  return (
    <div
      className="absolute flex items-center"
      style={{
        left: `${startPosition}%`,
        top: `${16 + verticalOffset * 45}px`,
        width: `${width}%`,
      }}
    >
      {/* Dashed line */}
      <div 
        className="flex-1 border-t-2 border-dashed border-[hsl(var(--destructive))]"
        style={{ minWidth: '20px' }}
      />
      {/* Arrow head */}
      <div className="flex items-center text-[hsl(var(--destructive))]">
        <ArrowRight className="h-5 w-5 -ml-1" />
      </div>
      {/* Label */}
      <span 
        className="absolute text-[10px] font-medium text-[hsl(var(--destructive))] whitespace-nowrap bg-[hsl(var(--primary-lighter))] px-1 rounded"
        style={{ 
          top: '-14px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        {label}
      </span>
    </div>
  );
};
