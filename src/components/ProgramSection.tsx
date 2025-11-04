import { ReactNode } from 'react';

interface ProgramSectionProps {
  programName: string;
  children: ReactNode;
}

export const ProgramSection = ({ programName, children }: ProgramSectionProps) => {
  return (
    <div className="border border-border rounded-lg overflow-hidden mb-6">
      <div className="bg-primary/10 border-b border-border px-4 py-3">
        <h2 className="text-lg font-bold text-foreground">{programName}</h2>
      </div>
      <div className="divide-y divide-border">
        {children}
      </div>
    </div>
  );
};
