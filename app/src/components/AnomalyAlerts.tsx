'use client';

interface Anomaly {
  SEVERITY: 'high' | 'medium' | 'low';
  TITLE: string;
  DESCRIPTION: string;
  METRIC: string;
  VALUE: string;
  ACTION: string;
}

interface AnomalyAlertsProps {
  anomalies: Anomaly[];
  title?: string;
}

function severityBadge(severity: string) {
  switch (severity) {
    case 'high':
      return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">HIGH</span>;
    case 'medium':
      return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">MED</span>;
    default:
      return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">LOW</span>;
  }
}

function severityIcon(severity: string) {
  switch (severity) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    default: return '🔵';
  }
}

export function AnomalyAlerts({ anomalies, title = 'AI-Detected Insights & Anomalies' }: AnomalyAlertsProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          ML.ANOMALY_DETECTION
        </span>
      </div>
      <div className="space-y-2">
        {anomalies.map((a, i) => (
          <div key={i} className="rounded border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm">{severityIcon(a.SEVERITY)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">{a.TITLE}</span>
                  {severityBadge(a.SEVERITY)}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600">{a.DESCRIPTION}</p>
                <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                  <span className="text-slate-400">Metric: <span className="font-medium text-slate-600">{a.METRIC}</span></span>
                  <span className="text-slate-400">Value: <span className="font-medium text-slate-600">{a.VALUE}</span></span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-blue-700">→ {a.ACTION}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
