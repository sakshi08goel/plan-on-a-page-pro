interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
}

export const TimelineHeader = ({ startDate, endDate }: TimelineHeaderProps) => {
  // Generate dynamic quarters based on date range
  const generateQuarters = () => {
    const quarters: Array<{ year: string; quarter: string; months: string[] }> = [];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Start from the beginning of the start month
    start.setDate(1);
    
    // Round down to quarter start
    const startQuarter = Math.floor(start.getMonth() / 3);
    start.setMonth(startQuarter * 3);
    
    // Round up to quarter end
    const endQuarter = Math.ceil((end.getMonth() + 1) / 3);
    const endMonth = endQuarter * 3;
    
    let current = new Date(start);
    
    while (current <= end || current.getFullYear() < end.getFullYear() || 
           (current.getFullYear() === end.getFullYear() && current.getMonth() < endMonth)) {
      const year = current.getFullYear().toString();
      const quarter = `Q${Math.floor(current.getMonth() / 3) + 1}`;
      const months: string[] = [];
      
      // Add 3 months for this quarter
      for (let i = 0; i < 3; i++) {
        if (current <= end) {
          months.push(monthNames[current.getMonth()]);
          current.setMonth(current.getMonth() + 1);
        }
      }
      
      if (months.length > 0) {
        quarters.push({ year, quarter, months });
      }
    }
    
    return quarters;
  };

  const quarters = generateQuarters();

  return (
    <div className="sticky top-0 z-10 bg-background border-b-2 border-border">
      <div className="flex min-w-[1400px]">
        <div className="w-64 flex-shrink-0 border-r border-border" />
        <div className="flex-1 flex">
          {quarters.map((q, idx) => (
            <div key={idx} className="flex-1">
              <div className="bg-primary text-primary-foreground text-center py-2 font-bold border-r border-background">
                {q.year}
              </div>
              <div className="bg-secondary text-secondary-foreground text-center py-2 font-semibold border-r border-background">
                {q.quarter}
              </div>
              <div className="flex border-r border-border">
                {q.months.map((month, mIdx) => (
                  <div
                    key={mIdx}
                    className="flex-1 bg-muted text-center py-1.5 text-xs font-medium border-r border-border last:border-r-0"
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
