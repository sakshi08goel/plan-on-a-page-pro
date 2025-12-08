/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { FileUpload, RoadmapData } from "@/components/FileUpload";
import { TimelineHeader } from "@/components/TimelineHeader";
import { RoadmapRow } from "@/components/RoadmapRow";
import { ProgramSection } from "@/components/ProgramSection";
import { MilestoneMarker } from "@/components/MilestoneMarker";
import { PhaseBar } from "@/components/PhaseBar";
import { Legend } from "@/components/Legend";
import { Download, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPowerPoint } from "@/utils/exportPowerPoint";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const Index = () => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData[]>([]);
  const [journeyOrder, setJourneyOrder] = useState<Record<string, string[]>>(
    {}
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Determine dynamic timeline range based on data
  const parsedDates = roadmapData
    .map((d) => new Date(d.plannedDeliveryDate))
    .filter((d) => !isNaN(d.getTime()));

  const timelineStart = parsedDates.length
    ? new Date(Math.min(...parsedDates.map((d) => d.getTime())))
    : new Date("2025-07-01"); // fallback

  const timelineEnd = parsedDates.length
    ? new Date(Math.max(...parsedDates.map((d) => d.getTime())))
    : new Date("2026-06-30"); // fallback

  // Calculate position on timeline (0-100%) based on date
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

  // Group roadmap data by program
  const groupedData = roadmapData.reduce((acc, item) => {
    if (!acc[item.program]) {
      acc[item.program] = [];
    }
    acc[item.program].push(item);
    return acc;
  }, {} as Record<string, RoadmapData[]>);

  // Get unique journeys per program
  const programJourneys = Object.entries(groupedData).reduce(
    (acc, [program, items]) => {
      const journeys = Array.from(new Set(items.map((item) => item.journey)));
      // Use custom order if exists, otherwise use default order
      acc[program] = journeyOrder[program] || journeys;
      return acc;
    },
    {} as Record<string, string[]>
  );

  // Initialize journey order when data changes
  useState(() => {
    if (roadmapData.length > 0 && Object.keys(journeyOrder).length === 0) {
      const initialOrder = Object.entries(groupedData).reduce(
        (acc, [program, items]) => {
          const journeys = Array.from(
            new Set(items.map((item) => item.journey))
          );
          acc[program] = journeys;
          return acc;
        },
        {} as Record<string, string[]>
      );
      setJourneyOrder(initialOrder);
    }
  });

  // Get milestones for a specific journey with vertical positioning to avoid overlaps
  const getMilestonesForJourney = (program: string, journey: string) => {
    const milestones = roadmapData.filter(
      (item) => item.program === program && item.journey === journey
    );

    // Sort by position on timeline
    const milestonesWithPosition = milestones
      .map((m) => ({
        ...m,
        position: calculatePosition(m.plannedDeliveryDate, "milestone"),
      }))
      .sort((a, b) => a.position - b.position);

    // Detect overlaps (within 5% of timeline = approximately same month)
    const overlapThreshold = 6;
    const milestonesWithOffset: Array<any> = [];

    for (let idx = 0; idx < milestonesWithPosition.length; idx++) {
      const milestone = milestonesWithPosition[idx];
      let verticalOffset = 0;

      // Check for overlaps with previous milestones
      for (let i = 0; i < idx; i++) {
        const prevMilestone = milestonesWithOffset[i];
        if (
          Math.abs(milestone.position - prevMilestone.position) <
          overlapThreshold
        ) {
          verticalOffset = Math.max(
            verticalOffset,
            prevMilestone.verticalOffset + 1
          );
        } else {
          // Also check for date overlaps based on sprint requirements
          const startDate = calculateStartDate(
            milestone.plannedDeliveryDate,
            milestone.sprintRequired
          );
          if (startDate <= new Date(prevMilestone.plannedDeliveryDate)) {
            verticalOffset = Math.max(
              verticalOffset,
              prevMilestone.verticalOffset + 1
            );
          } else {
            verticalOffset = prevMilestone.verticalOffset;
          }
        }
      }

      milestonesWithOffset.push({ ...milestone, verticalOffset });
    }

    return milestonesWithOffset;
  };

  // Calculate row height based on max stacked milestones
  const getRowHeight = (program: string, journey: string) => {
    const milestones = getMilestonesForJourney(program, journey);
    const maxOffset = Math.max(
      0,
      ...milestones.map((m) => m.verticalOffset || 0)
    );
    return Math.max(100, 60 + maxOffset * 50);
  };

  const calculateStartDate = (endDateStr: string, sprintRequired: number) => {
    const endDate = new Date(endDateStr);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - sprintRequired * 14);
    return startDate;
  };

  // Calculate build phase bar for tech drops (63 days before)
  const getBuildPhases = (milestones: any[]) => {
    return (
      milestones
        // .filter(m => {
        //   const type = m.milestoneType.toLowerCase();
        //   return type.includes('tech') && type.includes('drop') || type === 'techdrop';
        // })
        .map((m, idx) => {
          const startDate = calculateStartDate(
            m.plannedDeliveryDate,
            m.sprintRequired
          );
          const startPosition =
            calculatePosition(
              startDate.toISOString().slice(0, 10),
              "buildPhase"
            );
          const endPosition = m.position;

          return {
            milestoneType: m.milestoneType,
            verticalOffset: m.verticalOffset,
            id: `build-${idx}`,
            label: `Build Phase`,
            startPosition,
            endPosition,
          };
        })
    );
  };

  // const getBuildPhases = (milestones: any[]) => {
  //   return (
  //     milestones
  //       // .filter(m => {
  //       //   const type = m.milestoneType.toLowerCase();
  //       //   return type.includes('tech') && type.includes('drop') || type === 'techdrop';
  //       // })
  //       .map((m, idx) => {
  //         const endDate = new Date(m.plannedDeliveryDate);
  //         const startDate = new Date(endDate);
  //         startDate.setDate(startDate.getDate() - m.sprintRequired * 14); // 63 days before

  //         const startPosition =
  //           calculatePosition(startDate.toISOString().slice(0, 10)) - 3;
  //         const endPosition = m.position;

  //         return {
  //           ...m,
  //           buildPhase: {
  //             id: `build-${idx}`,
  //             label: `Build Phase`,
  //             startPosition,
  //             endPosition,
  //           },
  //         };
  //       })
  //   );
  // };

  const downloadTemplate = () => {
    const template = [
      [
        "Program",
        "Feature",
        "Milestone Type",
        "Delivery Milestone",
        "Planned Delivery Date",
      ],
      ["Deposits", "Maturity", "Key", "Maturity-Cosumer Go-live", "2025-10-15"],
      [
        "Deposits",
        "Notice Account Servicing",
        "Milestone",
        "Tech Drop 1",
        "2026-03-01",
      ],
      [
        "FX",
        "FX Convert",
        "Milestone",
        "FX outward via core convert",
        "2025-09-15",
      ],
    ];

    const csvContent = template.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "roadmap-template.csv";
    a.click();
  };

  const handleExportPowerPoint = () => {
    if (roadmapData.length === 0) {
      return;
    }
    exportToPowerPoint(roadmapData);
  };

  const handleDragEnd = (event: DragEndEvent, programName: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setJourneyOrder((prevOrder) => {
        const programJourneys = prevOrder[programName] || [];
        const oldIndex = programJourneys.indexOf(active.id as string);
        const newIndex = programJourneys.indexOf(over.id as string);

        return {
          ...prevOrder,
          [programName]: arrayMove(programJourneys, oldIndex, newIndex),
        };
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                2025 Deliveries - Plan on a Page
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Program delivery roadmap visualization
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              {roadmapData.length > 0 && (
                <Button
                  onClick={handleExportPowerPoint}
                  variant="default"
                  size="sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export to PowerPoint
                </Button>
              )}
              <FileUpload onDataLoaded={setRoadmapData} />
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 py-6 overflow-x-auto">
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
              Required columns: Program, Feature, Milestone Type, Delivery
              Milestone, Planned Delivery Date
            </p>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        ) : (
          <div className="min-w-[1200px]">
            <div className="mb-4">
              <TimelineHeader
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
              />
            </div>

            {Object.entries(programJourneys).map(([programName, journeys]) => (
              <ProgramSection key={programName} programName={programName}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, programName)}
                >
                  <SortableContext
                    items={journeys}
                    strategy={verticalListSortingStrategy}
                  >
                    {journeys.map((journey, idx) => {
                      const milestones = getMilestonesForJourney(
                        programName,
                        journey
                      );
                      const buildPhases = getBuildPhases(milestones);

                      return (
                        <RoadmapRow
                          key={journey}
                          id={journey}
                          journey={journey}
                          rowHeight={getRowHeight(programName, journey)}
                        >
                          {/* Render build phases first (in background) */}
                          {buildPhases.map((phase) => (
                            <PhaseBar
                              key={phase.id}
                              label={phase.label}
                              startPosition={phase.startPosition}
                              endPosition={phase.endPosition}
                              verticalOffset={phase.verticalOffset}
                              rowHeight={getRowHeight(programName, journey)}
                              color="orange"
                            />
                          ))}
                          {/* Render milestones on top */}
                          {milestones.map((milestone, mIdx) => (
                            <MilestoneMarker
                              key={`${programName}-${journey}-${mIdx}`}
                              type={milestone.milestoneType}
                              label={milestone.deliveryMilestone}
                              position={milestone.position}
                              verticalOffset={milestone.verticalOffset}
                              // buildPhase={milestone.buildPhase}
                            />
                          ))}
                        </RoadmapRow>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </ProgramSection>
            ))}

            <div className="mt-6 bg-card border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">
                Loaded Data Summary
              </h2>
              <p className="text-sm text-muted-foreground">
                {roadmapData.length} milestones across{" "}
                {Object.keys(programJourneys).length} programs
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
