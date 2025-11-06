import { useState } from 'react';
import { FileUpload, RoadmapData } from '@/components/FileUpload';
import { TimelineHeader } from '@/components/TimelineHeader';
import { RoadmapRow } from '@/components/RoadmapRow';
import { ProgramSection } from '@/components/ProgramSection';
import { MilestoneMarker } from '@/components/MilestoneMarker';
import { Legend } from '@/components/Legend';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData[]>([]);

  // Determine dynamic timeline range based on data
  const parsedDates = roadmapData
    .map(d => new Date(d.plannedDeliveryDate))
    .filter(d => !isNaN(d.getTime()));

  const timelineStart = parsedDates.length
    ? new Date(Math.min(...parsedDates.map(d => d.getTime())))
    : new Date('2025-07-01'); // fallback

  const timelineEnd = parsedDates.length
    ? new Date(Math.max(...parsedDates.map(d => d.getTime())))
    : new Date('2026-06-30'); // fallback

  // Calculate position on timeline (0-100%) based on date
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

  // Group roadmap data by program
  const groupedData = roadmapData.reduce((acc, item) => {
    if (!acc[item.program]) {
      acc[item.program] = [];
    }
    acc[item.program].push(item);
    return acc;
  }, {} as Record<string, RoadmapData[]>);

  // Get unique journeys per program
  const programJourneys = Object.entries(groupedData).reduce((acc, [program, items]) => {
    const journeys = Array.from(new Set(items.map(item => item.journey)));
    acc[program] = journeys;
    return acc;
  }, {} as Record<string, string[]>);

  // Get milestones for a specific journey
  const getMilestonesForJourney = (program: string, journey: string) => {
    return roadmapData.filter(
      item => item.program === program && item.journey === journey
    );
  };

  const downloadTemplate = () => {
    const template = [
      ['Program', 'Feature', 'Milestone Type', 'Delivery Milestone', 'Planned Delivery Date'],
      ['Deposits', 'Maturity', 'Key', 'Maturity-Cosumer Go-live', '2025-10-15'],
      ['Deposits', 'Notice Account Servicing', 'Milestone', 'Tech Drop 1', '2026-03-01'],
      ['FX', 'FX Convert', 'Milestone', 'FX outward via core convert', '2025-09-15'],
    ];
    
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roadmap-template.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">2025 Deliveries - Plan on a Page</h1>
              <p className="text-sm text-muted-foreground mt-1">Program delivery roadmap visualization</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <FileUpload onDataLoaded={setRoadmapData} />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Legend />
        </div>

        {roadmapData.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Data Loaded</h2>
            <p className="text-muted-foreground mb-4">
              Upload an Excel file with your roadmap data to get started
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Required columns: Program, Feature, Milestone Type, Delivery Milestone, Planned Delivery Date
            </p>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <TimelineHeader />
            </div>

            {Object.entries(programJourneys).map(([programName, journeys]) => (
              <ProgramSection key={programName} programName={programName}>
                {journeys.map((journey, idx) => (
                  <RoadmapRow key={`${programName}-${idx}`} journey={journey}>
                    {getMilestonesForJourney(programName, journey).map((milestone, mIdx) => (
                      <MilestoneMarker
                        key={`${programName}-${journey}-${mIdx}`}
                        type={milestone.milestoneType}
                        label={milestone.deliveryMilestone}
                        position={calculatePosition(milestone.plannedDeliveryDate)}
                      />
                    ))}
                  </RoadmapRow>
                ))}
              </ProgramSection>
            ))}

            <div className="mt-6 bg-card border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Loaded Data Summary</h2>
              <p className="text-sm text-muted-foreground">
                {roadmapData.length} milestones across {Object.keys(programJourneys).length} programs
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
