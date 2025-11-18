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
  const calculatePosition = (dateString: string) => {
    if (!dateString) return 50;
    
    try {
      const date = new Date(dateString);
      const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
      const elapsed = date.getTime() - timelineStart.getTime();
      const position = (elapsed / totalDuration) * 100;
      
      return Math.max(0, Math.min(100, position));
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
  
  slide.addShape(pptx.ShapeType.rect, {
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

  slide.addShape(pptx.ShapeType.rect, {
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

  slide.addShape(pptx.ShapeType.rect, {
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

  slide.addShape(pptx.ShapeType.rect, {
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
  const rowHeight = 0.35;

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

      // Swimlane background - light cyan, aligned with quarters
      const firstQuarterX = timelineX;
      slide.addShape(pptx.ShapeType.rect, {
        x: firstQuarterX,
        y: currentY,
        w: timelineWidth,
        h: rowHeight,
        fill: { color: 'B3F5FF' },
        line: { color: 'CCCCCC', width: 1 }
      });

      // Process milestones
      const processedMilestones = milestones.map(m => ({
        ...m,
        position: calculatePosition(m.plannedDeliveryDate)
      })).sort((a, b) => a.position - b.position);

      // Assign vertical offsets
      const milestonesWithOffset: Array<any> = [];
      const overlapThreshold = 5;
      
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

      // Draw build phases
      milestonesWithOffset
        .filter(m => {
          const type = m.milestoneType.toLowerCase();
          return (type.includes('tech') && type.includes('drop')) || type === 'techdrop';
        })
        .forEach(m => {
          const endDate = new Date(m.plannedDeliveryDate);
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 63);
          
          const startPosition = calculatePosition(startDate.toISOString().slice(0, 10));
          const endPosition = m.position;
          
          const barX = timelineX + (startPosition / 100 * timelineWidth);
          const barWidth = ((endPosition - startPosition) / 100 * timelineWidth);
          
          slide.addShape(pptx.ShapeType.rect, {
            x: barX,
            y: currentY + rowHeight - 0.08,
            w: barWidth,
            h: 0.06,
            fill: { color: 'FF8800' }
          });
        });

      // Draw milestones with better positioning to avoid build phase overlap
      milestonesWithOffset.forEach(milestone => {
        const milestoneX = timelineX + (milestone.position / 100 * timelineWidth);
        // Alternate milestones above and below center to avoid overlap with build phase
        const isTechDrop = (milestone.milestoneType.toLowerCase().includes('tech') && 
                           milestone.milestoneType.toLowerCase().includes('drop')) || 
                           milestone.milestoneType.toLowerCase() === 'techdrop';
        // Tech drops go lower (near build phase bar), others go higher
        const baseOffset = isTechDrop ? 0.18 : 0.02;
        const offsetY = milestone.verticalOffset * 0.08;
        const milestoneY = currentY + baseOffset + offsetY;
        
        let color = '28A745'; // green checkpoint
        let size = 0.1;
        
        const lowerType = milestone.milestoneType.toLowerCase();
        
        if ((lowerType.includes('customer') && lowerType.includes('go') && lowerType.includes('live')) || 
            lowerType === 'key' || lowerType === 'star') {
          color = '9933CC'; // purple star
          size = 0.12;
        } else if ((lowerType.includes('tech') && lowerType.includes('drop')) || 
                   lowerType === 'milestone' || lowerType === 'triangle' || lowerType === 'techdrop') {
          color = '0266A6'; // dark blue triangle
          size = 0.11;
        }
        
        // Draw milestone marker
        slide.addShape(pptx.ShapeType.rect, {
          x: milestoneX - (size / 2),
          y: milestoneY,
          w: size,
          h: size,
          fill: { color: color },
          line: { color: color, width: 1 }
        });
        
        // Add milestone label
        const labelText = milestone.deliveryMilestone.length > 20 
          ? milestone.deliveryMilestone.substring(0, 18) + '...' 
          : milestone.deliveryMilestone;
          
        slide.addText(labelText, {
          x: milestoneX - 0.25,
          y: milestoneY + size + 0.01,
          w: 0.5,
          h: 0.12,
          fontSize: 6,
          color: '1a1a1a',
          align: 'center',
          breakLine: true
        });
      });

      currentY += rowHeight + 0.02;
    });

    currentY += 0.05; // Extra space between programs
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
