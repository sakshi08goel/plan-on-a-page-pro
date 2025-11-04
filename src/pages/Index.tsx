import { useState } from 'react';
import { FileUpload, RoadmapData } from '@/components/FileUpload';
import { TimelineHeader } from '@/components/TimelineHeader';
import { RoadmapRow } from '@/components/RoadmapRow';
import { MilestoneMarker } from '@/components/MilestoneMarker';
import { PhaseBar } from '@/components/PhaseBar';
import { Legend } from '@/components/Legend';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData[]>([]);

  // Sample data structure for demo
  const sampleJourneys = [
    { category: 'Deposits', journey: 'Run The Bank' },
    { category: 'Deposits', journey: '95D Product' },
    { category: 'Deposits', journey: 'Maturity' },
    { category: 'Deposits', journey: 'Funding IAS' },
    { category: 'Deposits', journey: 'Notice Account Servicing' },
    { category: 'Deposits', journey: 'AOV Modernisation & TODS' },
    { category: 'Deposits', journey: 'Client Money Onboarding' },
    { category: 'FX', journey: 'FX Convert' },
    { category: 'VISA', journey: 'VISA Debit Card Issuance' },
    { category: 'CMAS', journey: 'Card Management Proxy Services' },
  ];

  const downloadTemplate = () => {
    const template = [
      ['Program', 'Journey', 'Milestone Type', 'Delivery Milestone', 'Planned Delivery Date'],
      ['Deposits', 'Maturity', 'Key', 'Maturity-Cosumer Go-live', '2025-10-15'],
      ['FX', 'FX Convert', 'Milestone', 'Tech Drop 1', '2026-03-01'],
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

        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
          <TimelineHeader />
          
          <div className="divide-y divide-border">
            {sampleJourneys.map((item, idx) => (
              <RoadmapRow key={idx} journey={item.journey} category={item.category}>
                {/* Demo milestones - these would be data-driven */}
                {item.journey === 'Run The Bank' && (
                  <PhaseBar label="Warranty & Run Support" startPosition={0} endPosition={100} color="cyan" />
                )}
                {item.journey === 'Maturity' && (
                  <>
                    <MilestoneMarker type="triangle" label="Maturity review screen" position={8} />
                    <MilestoneMarker type="star" label="Maturity-Cosumer Go-live" position={35} />
                  </>
                )}
                {item.journey === 'Notice Account Servicing' && (
                  <>
                    <PhaseBar label="Understand & Incubation" startPosition={25} endPosition={58} color="orange" />
                    <MilestoneMarker type="circle" label="Decoupling Strategy" position={65} />
                    <MilestoneMarker type="triangle" label="Tech Drop 1" position={75} />
                  </>
                )}
                {item.journey === 'FX Convert' && (
                  <>
                    <MilestoneMarker type="triangle" label="FX outward via core convert" position={28} />
                    <MilestoneMarker type="triangle" label="Tech Drop 1" position={75} />
                  </>
                )}
              </RoadmapRow>
            ))}
          </div>
        </div>

        {roadmapData.length > 0 && (
          <div className="mt-6 bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Loaded Data</h2>
            <p className="text-sm text-muted-foreground">{roadmapData.length} milestones loaded from Excel</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
