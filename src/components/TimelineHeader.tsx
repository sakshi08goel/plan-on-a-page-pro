function formatDateToMMMYYYY(date) {
  const options = { month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function getQuartersBetweenDates(start, end) {
  const startDate = formatDateToMMMYYYY(start);
  const endDate = formatDateToMMMYYYY(end); // Convert input strings (e.g., "sep-2025") to Date objects

  const startParts = startDate.split(" ");
  const endParts = endDate.split(" ");

  const startMonth = startParts[0].toUpperCase();
  const startYear = parseInt(startParts[1]);
  const endMonth = endParts[0].toUpperCase();
  const endYear = parseInt(endParts[1]); // Month mapping

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ]; // Quarter mapping

  const quarterMap = {
    Q1: ["JAN", "FEB", "MAR"],
    Q2: ["APR", "MAY", "JUN"],
    Q3: ["JUL", "AUG", "SEP"],
    Q4: ["OCT", "NOV", "DEC"],
  }; // Get numeric month index

  const startIndex = months.indexOf(startMonth);
  const endIndex = months.indexOf(endMonth); // Build result array

  const quarters = [];
  let currentYear = startYear;
  let currentMonthIndex = startIndex;

  while (
    currentYear < endYear ||
    (currentYear === endYear && currentMonthIndex <= endIndex)
  ) {
    // Determine quarter
    let quarter = "";
    let quarterMonths = [];

    if (currentMonthIndex <= 2) {
      quarter = "Q1";
      quarterMonths = quarterMap.Q1.filter(
        (m) =>
          months.indexOf(m) >= currentMonthIndex || currentYear !== startYear
      );
    } else if (currentMonthIndex <= 5) {
      quarter = "Q2";
      quarterMonths = quarterMap.Q2.filter(
        (m) =>
          months.indexOf(m) >= currentMonthIndex || currentYear !== startYear
      );
    } else if (currentMonthIndex <= 8) {
      quarter = "Q3";
      quarterMonths = quarterMap.Q3.filter(
        (m) =>
          months.indexOf(m) >= currentMonthIndex || currentYear !== startYear
      );
    } else {
      quarter = "Q4";
      quarterMonths = quarterMap.Q4.filter(
        (m) =>
          months.indexOf(m) >= currentMonthIndex || currentYear !== startYear
      );
    } // Adjust for end date

    if (currentYear === endYear) {
      quarterMonths = quarterMonths.filter(
        (m) => months.indexOf(m) <= endIndex
      );
    }

    quarters.push({
      year: currentYear.toString(),
      quarter: quarter,
      months: quarterMonths,
    }); // Move to next quarter

    if (quarter === "Q4") {
      currentYear++;
      currentMonthIndex = 0;
    } else {
      currentMonthIndex = months.indexOf(quarterMap[quarter][2]) + 1; // next quarter start
    }
  }

  return quarters;
}

export const TimelineHeader = ({
  timelineStart,
  timelineEnd,
}: {
  timelineStart: Date;
  timelineEnd: Date;
}) => {
  console.log(timelineStart, timelineEnd);

  const quarters = getQuartersBetweenDates(timelineStart, timelineEnd);
  // const quarters = [
  //   { year: "2025", quarter: "Q3", months: ["SEP"] },
  //   { year: "2025", quarter: "Q4", months: ["OCT", "NOV", "DEC"] },
  //   { year: "2026", quarter: "Q1", months: ["JAN", "FEB", "MAR"] },
  //   { year: "2026", quarter: "Q2", months: ["APR", "MAY", "JUN"] },
  //   { year: "2026", quarter: "Q3", months: ["JUL"] },
  // ];

  return (
    <div className="sticky top-0 z-10 bg-background border-b-2 border-border">
      <div className="flex">
        <div className="w-48 flex-shrink-0 border-r border-border" />
        <div className="flex-1 flex">
          {quarters.map((q, idx) => (
            <div
              key={idx}
              className={`flex-[${q.months.length}_0_0]`}
              style={{ flex: `${q.months.length} 1 0%` }}
            >
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
