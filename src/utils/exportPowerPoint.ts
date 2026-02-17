import pptxgen from 'pptxgenjs';
import { RoadmapData } from '@/components/FileUpload';

export const exportToPowerPoint = (roadmapData: RoadmapData[]) => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  
  // Determine timeline range
  const parsedDates = roadmapData
    .map(d => new Date(d.plannedDeliveryDate))
    .filter(d => !isNaN(d.getTime()));

  const timelineStart = parsedDates.length
    ? new Date(Math.min(...parsedDates.map(d => d.getTime())))
    : new Date('2025-07-01');

  const timelineEnd = parsedDates.length
    ? new Date(Math.max(...parsedDates.map(d => d.getTime())))
    : new Date('2026-06-30');

  // Calculate position on timeline (0-100%)
  const calculatePosition = (dateString: string, eventTpe: string) => {
    if (!dateString) return 50;
    
    try {
      const date = new Date(dateString);
      const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
      const elapsed = date.getTime() - timelineStart.getTime();
      const position = (elapsed / totalDuration) * 100;
      
      return eventTpe === "milestone"
        ? Math.max(3, Math.min(97, position))
        : Math.max(0, Math.min(97, position));
    } catch {
      return 50;
    }
  };

  // Group data by program
  const groupedData = roadmapData.reduce((acc, item) => {
    if (!acc[item.program]) {
      acc[item.program] = [];
    }
    acc[item.program].push(item);
    return acc;
  }, {} as Record<string, RoadmapData[]>);

  // SINGLE SLIDE with ALL programs
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  
  // Title
  slide.addText('2025 Deliveries - Plan on a Page', {
    x: 0.3,
    y: 0.15,
    w: 12.7,
    h: 0.4,
    fontSize: 24,
    bold: true,
    color: '1a1a1a',
    align: 'center'
  });

  // Legend
  const legendY = 0.6;
  const legendStartX = 0.5;
  
  slide.addShape(pptx.ShapeType.star6, {
    x: legendStartX,
    y: legendY,
    w: 0.12,
    h: 0.12,
    fill: { color: '9933CC' }
  });
  slide.addText('Key Milestone', {
    x: legendStartX + 0.15,
    y: legendY,
    w: 1,
    h: 0.12,
    fontSize: 8,
    color: '1a1a1a',
    valign: 'middle'
  });

  slide.addShape(pptx.ShapeType.triangle, {
    x: legendStartX + 1.3,
    y: legendY,
    w: 0.12,
    h: 0.12,
    fill: { color: '0266A6' }
  });
  slide.addText('Tech Drop', {
    x: legendStartX + 1.45,
    y: legendY,
    w: 0.8,
    h: 0.12,
    fontSize: 8,
    color: '1a1a1a',
    valign: 'middle'
  });

  slide.addShape(pptx.ShapeType.ellipse, {
    x: legendStartX + 2.4,
    y: legendY,
    w: 0.12,
    h: 0.12,
    fill: { color: '28A745' }
  });
  slide.addText('Checkpoint', {
    x: legendStartX + 2.55,
    y: legendY,
    w: 0.9,
    h: 0.12,
    fontSize: 8,
    color: '1a1a1a',
    valign: 'middle'
  });

  slide.addShape(pptx.ShapeType.rightArrow, {
    x: legendStartX + 3.6,
    y: legendY,
    w: 0.12,
    h: 0.12,
    fill: { color: 'FF8800' }
  });
  slide.addText('Build Phase', {
    x: legendStartX + 3.75,
    y: legendY,
    w: 0.9,
    h: 0.12,
    fontSize: 8,
    color: '1a1a1a',
    valign: 'middle'
  });

  // Timeline configuration
  const timelineY = 0.85;
  const timelineWidth = 11.2;
  const timelineX = 1.8;
  const labelWidth = 1.5;

  // Generate quarters
  const quarters: Array<{ label: string; startDate: Date; endDate: Date }> = [];
  const currentQuarter = new Date(timelineStart);
  currentQuarter.setMonth(Math.floor(currentQuarter.getMonth() / 3) * 3, 1);
  
  while (currentQuarter <= timelineEnd) {
    const quarterStart = new Date(currentQuarter);
    const quarterEnd = new Date(currentQuarter);
    quarterEnd.setMonth(quarterEnd.getMonth() + 3, 0);
    
    const q = Math.floor(quarterStart.getMonth() / 3) + 1;
    const year = quarterStart.getFullYear();
    
    quarters.push({
      label: `Q${q} ${year}`,
      startDate: quarterStart,
      endDate: quarterEnd
    });
    
    currentQuarter.setMonth(currentQuarter.getMonth() + 3);
  }

  // Draw quarter headers
  quarters.forEach((quarter, idx) => {
    const qWidth = timelineWidth / quarters.length;
    const qX = timelineX + (idx * qWidth);
    
    slide.addShape(pptx.ShapeType.rect, {
      x: qX,
      y: timelineY,
      w: qWidth,
      h: 0.3,
      fill: { color: 'E8E8E8' },
      line: { color: 'CCCCCC', width: 1 }
    });
    
    slide.addText(quarter.label, {
      x: qX,
      y: timelineY,
      w: qWidth,
      h: 0.3,
      fontSize: 9,
      bold: true,
      color: '1a1a1a',
      align: 'center',
      valign: 'middle'
    });
  });

  // Draw all programs
  let currentY = timelineY + 0.35;
  const baseRowHeight = 0.75;          // FIX 1: increased from 0.55 → 0.75 to give room for icon + text
  const milestoneVerticalSpacing = 0.25; // FIX 2: increased from 0.2 → 0.25 for better stacking

  Object.entries(groupedData).forEach(([programName, items]) => {
    // Program header row
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3,
      y: currentY,
      w: labelWidth,
      h: 0.3,
      fill: { color: '0266A6' },
      line: { color: 'CCCCCC', width: 1 }
    });
    
    slide.addText(programName, {
      x: 0.35,
      y: currentY,
      w: labelWidth - 0.1,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: 'FFFFFF',
      valign: 'middle'
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: timelineX,
      y: currentY,
      w: timelineWidth,
      h: 0.3,
      fill: { color: 'D6EAF8' },
      line: { color: 'CCCCCC', width: 1 }
    });

    currentY += 0.32;

    // Group by journey
    const journeyGroups = items.reduce((acc, item) => {
      if (!acc[item.journey]) {
        acc[item.journey] = [];
      }
      acc[item.journey].push(item);
      return acc;
    }, {} as Record<string, RoadmapData[]>);

    // Draw each journey
    Object.entries(journeyGroups).forEach(([journey, milestones]) => {
      // Process milestones first to calculate required height
      const processedMilestones = milestones.map(m => ({
        ...m,
        position: calculatePosition(m.plannedDeliveryDate, "milestone")
      })).sort((a, b) => a.position - b.position);

      // Assign vertical offsets with better spacing
      const milestonesWithOffset: Array<any> = [];
      const overlapThreshold = 8;
      
      for (let idx = 0; idx < processedMilestones.length; idx++) {
        const milestone = processedMilestones[idx];
        let verticalOffset = 0;
        
        for (let i = 0; i < idx; i++) {
          const prevMilestone = milestonesWithOffset[i];
          if (Math.abs(milestone.position - prevMilestone.position) < overlapThreshold) {
            verticalOffset = Math.max(verticalOffset, prevMilestone.verticalOffset + 1);
          }
        }
        
        milestonesWithOffset.push({ ...milestone, verticalOffset });
      }

      // Calculate dynamic row height based on max vertical offset
      const maxOffset = milestonesWithOffset.length > 0 
        ? Math.max(...milestonesWithOffset.map(m => m.verticalOffset))
        : 0;
      const rowHeight = Math.max(baseRowHeight, baseRowHeight + (maxOffset * milestoneVerticalSpacing));

      // Journey label
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.3,
        y: currentY,
        w: labelWidth,
        h: rowHeight,
        fill: { color: 'F8F8F8' },
        line: { color: 'CCCCCC', width: 1 }
      });
      
      slide.addText(journey, {
        x: 0.35,
        y: currentY,
        w: labelWidth - 0.1,
        h: rowHeight,
        fontSize: 8,
        color: '1a1a1a',
        valign: 'middle'
      });

      // Swimlane background - light cyan
      slide.addShape(pptx.ShapeType.rect, {
        x: timelineX,
        y: currentY,
        w: timelineWidth,
        h: rowHeight,
        fill: { color: 'B3F5FF' },
        line: { color: 'CCCCCC', width: 1 }
      });

      // Draw build phases
      milestonesWithOffset.forEach(m => {
        const endDate = new Date(m.plannedDeliveryDate);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 63);
        
        const startPosition = calculatePosition(startDate.toISOString().slice(0, 10), "buildPhase");
        const endPosition = m.position;
        
        const barX = timelineX + (startPosition / 100 * timelineWidth);
        const barWidth = ((endPosition - startPosition) / 100 * timelineWidth);
        
        slide.addShape(pptx.ShapeType.rightArrow, {
          x: barX,
          y: currentY + rowHeight - 0.1,
          w: barWidth,
          h: 0.08,
          fill: { color: 'FF8800' }
        });
      });

      // Draw milestones
      milestonesWithOffset.forEach(milestone => {
        const milestoneX = timelineX + (milestone.position / 100 * timelineWidth);
        const offsetY = milestone.verticalOffset * milestoneVerticalSpacing;

        // ─────────────────────────────────────────────────────────────────
        // FIX 3: The core overlap fix.
        //
        // OLD (broken) code placed both the icon AND the text at the same
        // Y coordinate (milestoneY), so the shape drew directly on top of
        // the label:
        //
        //   const milestoneY = currentY + 0.1 + offsetY;
        //   slide.addShape(..., { y: milestoneY, h: size });   ← icon here
        //   slide.addText(...,  { y: milestoneY + size + 0.02 }); ← text overlaps
        //
        // With small `size` values (0.10–0.12") and a text box height of
        // only 0.16", the text box was not tall enough and sat underneath
        // the icon at nearly the same pixel position.
        //
        // FIX: use separate, clearly spaced Y values:
        //   iconY  = top of the icon shape
        //   textY  = iconY + icon height + a visible gap (0.05")
        //   textH  = 0.28" (tall enough to wrap 2 short lines at 7 pt)
        // ─────────────────────────────────────────────────────────────────

        const lowerType = milestone.milestoneType.toLowerCase();

        let color = '28A745';
        let size  = 0.13;    // unified icon size for all types

        const iconY  = currentY + 0.06 + offsetY;  // icon top
        const textY  = iconY + size + 0.05;         // text starts BELOW icon + gap
        const textW  = 0.80;
        const textH  = 0.28;                        // tall enough for 2-line wrap
        const textX  = milestoneX - textW / 2;      // centred under icon

        if (
          (lowerType.includes('customer') && lowerType.includes('go') && lowerType.includes('live')) ||
          lowerType === 'key' || lowerType === 'star'
        ) {
          color = '9933CC'; // purple star
          slide.addShape(pptx.ShapeType.star6, {
            x: milestoneX - size / 2,
            y: iconY,                 // ← icon at iconY
            w: size,
            h: size,
            fill: { color },
            line: { color, width: 1 }
          });

        } else if (
          (lowerType.includes('tech') && lowerType.includes('drop')) ||
          lowerType === 'milestone' || lowerType === 'triangle' || lowerType === 'techdrop'
        ) {
          color = '0266A6'; // dark blue triangle
          slide.addShape(pptx.ShapeType.triangle, {
            x: milestoneX - size / 2,
            y: iconY,                 // ← icon at iconY
            w: size,
            h: size,
            fill: { color },
            line: { color, width: 1 }
          });

        } else {
          // Checkpoint / Critical Dependency — green ellipse
          slide.addShape(pptx.ShapeType.ellipse, {
            x: milestoneX - size / 2,
            y: iconY,                 // ← icon at iconY
            w: size,
            h: size,
            fill: { color },
            line: { color, width: 1 }
          });
        }

        // Text label — now sits BELOW the icon, not on top of it
        const labelText = milestone.deliveryMilestone.length > 30
          ? milestone.deliveryMilestone.substring(0, 28) + '…'
          : milestone.deliveryMilestone;

        slide.addText(labelText, {
          x: textX,
          y: textY,    // ← text at textY (= iconY + size + gap)
          w: textW,
          h: textH,
          fontSize: 6.5,
          color: '1a1a1a',
          align: 'center',
          valign: 'top',
          wrap: true,  // FIX 4: allow wrapping so long names don't overflow
        });
      });

      currentY += rowHeight + 0.02;
    });

    currentY += 0.05;
  });

  // Summary at bottom
  const summaryY = currentY + 0.1;
  slide.addText(`Total: ${Object.keys(groupedData).length} Programs  |  ${roadmapData.length} Milestones`, {
    x: 0.3,
    y: summaryY,
    w: 12.7,
    h: 0.25,
    fontSize: 9,
    color: '666666',
    align: 'center',
    valign: 'middle'
  });

  // Generate and download
  pptx.writeFile({ fileName: '2025-Deliveries-Plan-on-a-Page.pptx' });
};
