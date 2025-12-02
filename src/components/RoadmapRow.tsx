import { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface RoadmapRowProps {
  id: string;
  journey: string;
  category?: string;
  children: ReactNode;
  rowHeight?: number;
}

export const RoadmapRow = ({ id, journey, category, children, rowHeight = 60 }: RoadmapRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex hover:bg-muted/30 transition-colors group"
    >
      <div className="w-48 flex-shrink-0 border-r border-border p-3 flex items-center gap-2">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">{journey}</div>
          {category && (
            <div className="text-xs text-muted-foreground font-medium mt-1">{category}</div>
          )}
        </div>
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
