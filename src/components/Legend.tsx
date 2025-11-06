import { Star, Triangle, Circle, ArrowRight } from 'lucide-react';

export const Legend = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">Legend</h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-[hsl(var(--timeline-key))] text-[hsl(var(--timeline-key))]" />
          <span>Customer Go-Live</span>
        </div>
        <div className="flex items-center gap-2">
          <Triangle className="h-4 w-4 fill-[hsl(var(--timeline-milestone))] text-[hsl(var(--timeline-milestone))]" />
          <span>Tech Drop</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="h-3 w-3 fill-[hsl(var(--timeline-checkpoint))] text-[hsl(var(--timeline-checkpoint))]" />
          <span>Checkpoint</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 bg-[hsl(var(--accent))] rounded flex items-center justify-center">
            <ArrowRight className="h-2 w-2 text-white" />
          </div>
          <span>Build Phase (63 days)</span>
        </div>
      </div>
    </div>
  );
};
