import pptxgen from 'pptxgenjs';
import { RoadmapData } from '@/components/FileUpload';

export const exportToPowerPoint = (roadmapData: RoadmapData[]) => {
  const pptx = new pptxgen();
  
  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: 'FFFFFF' };
  titleSlide.addText('2025 Deliveries - Plan on a Page', {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 1,
    fontSize: 36,
    bold: true,
    color: '1a1a1a',
    align: 'center'
  });
  titleSlide.addText('Program Delivery Roadmap', {
    x: 0.5,
    y: 2.5,
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

  // Create a slide for each program
  Object.entries(groupedData).forEach(([programName, items]) => {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    
    // Program title
    slide.addText(programName, {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 28,
      bold: true,
      color: '1a1a1a'
    });

    // Group by journey
    const journeyGroups = items.reduce((acc, item) => {
      if (!acc[item.journey]) {
        acc[item.journey] = [];
      }
      acc[item.journey].push(item);
      return acc;
    }, {} as Record<string, RoadmapData[]>);

    // Create table data
    const tableData: any[] = [
      [
        { text: 'Journey/Feature', options: { bold: true } },
        { text: 'Milestone Type', options: { bold: true } },
        { text: 'Delivery Milestone', options: { bold: true } },
        { text: 'Planned Date', options: { bold: true } }
      ]
    ];

    Object.entries(journeyGroups).forEach(([journey, milestones]) => {
      milestones.forEach((milestone, idx) => {
        const date = new Date(milestone.plannedDeliveryDate);
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric',
          day: 'numeric'
        });
        
        tableData.push([
          idx === 0 ? journey : '',
          milestone.milestoneType,
          milestone.deliveryMilestone,
          formattedDate
        ]);
      });
    });

    // Add table
    slide.addTable(tableData, {
      x: 0.5,
      y: 1.2,
      w: 9,
      fontSize: 11,
      border: { type: 'solid', pt: 1, color: 'CCCCCC' },
      color: '1a1a1a',
      fill: { color: 'FFFFFF' }
    });
  });

  // Summary slide
  const summarySlide = pptx.addSlide();
  summarySlide.background = { color: 'FFFFFF' };
  summarySlide.addText('Summary', {
    x: 0.5,
    y: 0.5,
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
    y: 1.5,
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
    y: 2.2,
    w: 8,
    h: 0.5,
    fontSize: 18,
    color: '1a1a1a'
  });

  // Generate and download
  pptx.writeFile({ fileName: '2025-Deliveries-Roadmap.pptx' });
};
