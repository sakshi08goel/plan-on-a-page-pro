import pptxgen from 'pptxgenjs';
import { RoadmapData } from '@/components/FileUpload';

export const exportToPowerPoint = (roadmapData: RoadmapData[]) => {
  const pptx = new pptxgen();
  
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

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: 'FFFFFF' };
  titleSlide.addText('2025 Deliveries - Plan on a Page', {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1,
    fontSize: 36,
    bold: true,
    color: '1a1a1a',
    align: 'center'
  });
  titleSlide.addText('Program Delivery Roadmap', {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.5,
    fontSize: 18,
    color: '666666',
    align: 'center'
  });

  // Group data by program
  const groupedData = roadmapData.reduce((acc, item) => {
    if (!acc[item.program]) {
      acc[item.program] = [];
    }
    acc[item.program].push(item);
    return acc;
  }, {} as Record<string, RoadmapData[]>);

  // Create visual roadmap slide for each program
  Object.entries(groupedData).forEach(([programName, items]) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    
    // Program title
    slide.addText(programName, {
      x: 0.3,
      y: 0.2,
      w: 9.4,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: '1a1a1a'
    });

    // Legend
    const legendY = 0.65;
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3,
      y: legendY,
      w: 0.15,
      h: 0.15,
      fill: { color: 'FFD700' }
    });
    slide.addText('Key Milestone', {
      x: 0.5,
      y: legendY,
      w: 1.2,
      h: 0.15,
      fontSize: 9,
      color: '1a1a1a',
      valign: 'middle'
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 1.8,
      y: legendY,
      w: 0.15,
      h: 0.15,
      fill: { color: '4169E1' }
    });
    slide.addText('Tech Drop', {
      x: 2.0,
      y: legendY,
      w: 1.2,
      h: 0.15,
      fontSize: 9,
      color: '1a1a1a',
      valign: 'middle'
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 3.3,
      y: legendY,
      w: 0.15,
      h: 0.15,
      fill: { color: '32CD32' }
    });
    slide.addText('Checkpoint', {
      x: 3.5,
      y: legendY,
      w: 1.2,
      h: 0.15,
      fontSize: 9,
      color: '1a1a1a',
      valign: 'middle'
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 4.8,
      y: legendY,
      w: 0.15,
      h: 0.15,
      fill: { color: 'FFA500' }
    });
    slide.addText('Build Phase', {
      x: 5.0,
      y: legendY,
      w: 1.2,
      h: 0.15,
      fontSize: 9,
      color: '1a1a1a',
      valign: 'middle'
    });

    // Timeline header area
    const timelineY = 0.95;
    const timelineWidth = 7.2;
    const timelineX = 2.5;

    // Generate quarters between start and end
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

    // Group by journey
    const journeyGroups = items.reduce((acc, item) => {
      if (!acc[item.journey]) {
        acc[item.journey] = [];
      }
      acc[item.journey].push(item);
      return acc;
    }, {} as Record<string, RoadmapData[]>);

    // Draw swimlanes
    let currentY = timelineY + 0.35;
    const rowHeight = 0.5;
    const labelWidth = 2.2;

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
        fontSize: 9,
        color: '1a1a1a',
        valign: 'middle'
      });

      // Swimlane background
      slide.addShape(pptx.ShapeType.rect, {
        x: timelineX,
        y: currentY,
        w: timelineWidth,
        h: rowHeight,
        fill: { color: 'F0F4F8' },
        line: { color: 'CCCCCC', width: 1 }
      });

      // Process milestones
      const processedMilestones = milestones.map(m => ({
        ...m,
        position: calculatePosition(m.plannedDeliveryDate)
      })).sort((a, b) => a.position - b.position);

      // Assign vertical offsets for overlapping milestones
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
            y: currentY + 0.35,
            w: barWidth,
            h: 0.08,
            fill: { color: 'FFA500' }
          });
        });

      // Draw milestones
      milestonesWithOffset.forEach(milestone => {
        const milestoneX = timelineX + (milestone.position / 100 * timelineWidth);
        const offsetY = milestone.verticalOffset * 0.15;
        const milestoneY = currentY + 0.1 + offsetY;
        
        let color = '32CD32'; // default checkpoint
        let shape = pptx.ShapeType.ellipse;
        let size = 0.12;
        
        const lowerType = milestone.milestoneType.toLowerCase();
        
        if ((lowerType.includes('customer') && lowerType.includes('go') && lowerType.includes('live')) || 
            lowerType === 'key' || lowerType === 'star') {
          color = 'FFD700'; // gold star
          shape = pptx.ShapeType.rect; // using rect as star shape
          size = 0.15;
        } else if ((lowerType.includes('tech') && lowerType.includes('drop')) || 
                   lowerType === 'milestone' || lowerType === 'triangle' || lowerType === 'techdrop') {
          color = '4169E1'; // blue triangle
          shape = pptx.ShapeType.rect;
          size = 0.13;
        }
        
        // Draw milestone marker
        slide.addShape(shape, {
          x: milestoneX - (size / 2),
          y: milestoneY,
          w: size,
          h: size,
          fill: { color: color }
        });
        
        // Add milestone label
        slide.addText(milestone.deliveryMilestone, {
          x: milestoneX - 0.3,
          y: milestoneY + size + 0.02,
          w: 0.6,
          h: 0.15,
          fontSize: 7,
          color: '1a1a1a',
          align: 'center',
          breakLine: true
        });
      });

      currentY += rowHeight + 0.05;
    });
  });

  // Summary slide
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: 'FFFFFF' };
  summarySlide.addText('Summary', {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: '1a1a1a'
  });

  const programCount = Object.keys(groupedData).length;
  const totalMilestones = roadmapData.length;
  
  summarySlide.addText([
    { text: 'Total Programs: ', options: { bold: true } },
    { text: programCount.toString() }
  ], {
    x: 1,
    y: 2.5,
    w: 8,
    h: 0.5,
    fontSize: 18,
    color: '1a1a1a'
  });

  summarySlide.addText([
    { text: 'Total Milestones: ', options: { bold: true } },
    { text: totalMilestones.toString() }
  ], {
    x: 1,
    y: 3.2,
    w: 8,
    h: 0.5,
    fontSize: 18,
    color: '1a1a1a'
  });

  // Generate and download
  pptx.writeFile({ fileName: '2025-Deliveries-Roadmap.pptx' });
};
