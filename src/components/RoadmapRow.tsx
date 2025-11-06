import { ReactNode } from 'react';

interface RoadmapRowProps {
  journey: string;
  category?: string;
  children: ReactNode;
  rowHeight?: number;
}

export const RoadmapRow = ({ journey, category, children, rowHeight = 60 }: RoadmapRowProps) => {
  return (
    <div className="flex hover:bg-muted/30 transition-colors group">
      <div className="w-64 flex-shrink-0 border-r border-border p-3 flex flex-col justify-center">
        <div className="text-sm font-semibold text-foreground">{journey}</div>
        {category && (
          <div className="text-xs text-muted-foreground font-medium mt-1">{category}</div>
        )}
      </div>
      <div 
        className="flex-1 bg-[hsl(var(--primary-lighter))] relative" 
        style={{ minHeight: `${rowHeight}px` }}
      >
        {children}
      </div>
    </div>
  );
};
