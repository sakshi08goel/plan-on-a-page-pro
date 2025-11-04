export const TimelineHeader = () => {
  const quarters = [
    { year: '2025', quarter: 'Q3', months: ['JUL', 'AUG', 'SEP'] },
    { year: '2025', quarter: 'Q4', months: ['OCT', 'NOV', 'DEC'] },
    { year: '2026', quarter: 'Q1', months: ['JAN', 'FEB', 'MAR'] },
    { year: '2026', quarter: 'Q2', months: ['APR', 'MAY', 'JUN'] },
  ];

  return (
    <div className="sticky top-0 z-10 bg-background border-b-2 border-border">
      <div className="flex">
        <div className="w-48 flex-shrink-0 border-r border-border" />
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
