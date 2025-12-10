import { useCallback } from "react";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSprintsRequired } from "@/lib/sizeCalculator";

export interface RoadmapData {
  program: string;
  journey: string;
  milestoneType: string;
  deliveryMilestone: string;
  plannedDeliveryDate: string;
  sprintRequired: number;
  impactOn?: string; // Feature impacted by critical dependency
}

interface FileUploadProps {
  onDataLoaded: (data: RoadmapData[]) => void;
}

export const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const { toast } = useToast();

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
          }) as any[];

          // Normalize date values from Excel (supports Date objects, strings, and Excel serial numbers)
          const normalizeDate = (value: any): string => {
            const excelSerialToDate = (serial: number) => {
              // Excel serial date: days since 1899-12-30
              const excelEpoch = Date.UTC(1899, 11, 30);
              const ms = excelEpoch + serial * 24 * 60 * 60 * 1000;
              return new Date(ms);
            };

            if (!value) return "";
            if (value instanceof Date)
              return value.toLocaleDateString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
            if (typeof value === "number")
              return excelSerialToDate(value).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

            const d = new Date(value);
            return isNaN(d.getTime())
              ? ""
              : d.toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
          };

          const parsedData: RoadmapData[] = jsonData.map((row) => {
            const milestoneType = row["Milestone Type"] || row.milestoneType || "";
            const isCriticalDependency = milestoneType.toLowerCase().includes("critical") && 
                                          milestoneType.toLowerCase().includes("depend");
            
            return {
              program: row.Program || row.program || "",
              journey:
                row.Feature || row.feature || row.Journey || row.journey || "",
              milestoneType,
              deliveryMilestone:
                row["Delivery Milestone"] || row.deliveryMilestone || "",
              plannedDeliveryDate: normalizeDate(
                row["Planned Delivery Date"] ||
                  row.plannedDeliveryDate ||
                  row.PlannedEndDate ||
                  row.plannedEndDate
              ),
              // No sprint required for critical dependencies
              sprintRequired: isCriticalDependency ? 0 : (getSprintsRequired(row["Tshirt Size"], "max") || row.sprintRequired || 0),
              impactOn: row["Impact On"] || row.impactOn || "",
            };
          });

          onDataLoaded(parsedData);
          toast({
            title: "Success",
            description: `Loaded ${parsedData.length} milestones`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to parse Excel file",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onDataLoaded, toast]
  );

  return (
    <div className="relative">
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button asChild variant="outline" className="cursor-pointer">
          <span>
            <Upload className="mr-2 h-4 w-4" />
            Upload Excel
          </span>
        </Button>
      </label>
    </div>
  );
};
