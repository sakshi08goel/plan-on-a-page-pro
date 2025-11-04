import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface RoadmapData {
  program: string;
  journey: string;
  milestoneType: string;
  deliveryMilestone: string;
  plannedDeliveryDate: string;
}

interface FileUploadProps {
  onDataLoaded: (data: RoadmapData[]) => void;
}

export const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const { toast } = useToast();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const parsedData: RoadmapData[] = jsonData.map((row) => ({
          program: row.Program || row.program || '',
          journey: row.Journey || row.journey || '',
          milestoneType: row['Milestone Type'] || row.milestoneType || '',
          deliveryMilestone: row['Delivery Milestone'] || row.deliveryMilestone || '',
          plannedDeliveryDate: row['Planned Delivery Date'] || row.plannedDeliveryDate || '',
        }));

        onDataLoaded(parsedData);
        toast({
          title: 'Success',
          description: `Loaded ${parsedData.length} milestones`,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to parse Excel file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [onDataLoaded, toast]);

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
