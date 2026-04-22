import { Accessibility } from 'lucide-react';

interface ChartNotesProps {
  libraries: string;
  recommendation: string;
  accessibility: string;
}

export function ChartNotes({ libraries, recommendation, accessibility }: ChartNotesProps) {
  return (
    <div className="chart-notes">
      <p>
        <strong>권장 라이브러리:</strong> {libraries}
      </p>
      <p>
        <strong>선택 기준:</strong> {recommendation}
      </p>
      <div className="a11y-note">
        <Accessibility className="icon-sm" />
        <p>{accessibility}</p>
      </div>
    </div>
  );
}
