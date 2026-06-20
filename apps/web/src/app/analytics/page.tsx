'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AnalyticsChart } from '@/components/AnalyticsChart';

interface Analytics {
  overview: Record<string, number>;
  proofByCategory: { category: string; count: number; avgScore: number }[];
  conversionBySignal: { signal: string; rate: number }[];
  timeline: { date: string; sources: number; signals: number; assets: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    api.getAnalytics().then((d) => setData(d as Analytics));
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
        <p className="text-muted-foreground mt-2">Track proof discovery, signal performance, and conversion impact over time.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(data.overview).map(([key, value]) => (
          <Card key={key} hover className="text-center">
            <p className="text-2xl font-bold gradient-text">{key.includes('Lift') ? `${value}%` : value}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-semibold">Proof by Category</h2>
          <AnalyticsChart type="bar" data={data.proofByCategory.map((d) => ({ label: d.category, value: d.count }))} />
          {data.proofByCategory.map((cat) => (
            <div key={cat.category} className="flex items-center justify-between text-sm">
              <span>{cat.category}</span>
              <div className="flex gap-3">
                <Badge className="bg-secondary text-secondary-foreground">{cat.count} signals</Badge>
                <span className="text-primary">{cat.avgScore} avg</span>
              </div>
            </div>
          ))}
        </Card>
        <Card className="space-y-4">
          <h2 className="font-semibold">Conversion by Signal Type</h2>
          <AnalyticsChart type="radial" data={data.conversionBySignal.map((d) => ({ label: d.signal, value: d.rate }))} />
        </Card>
      </div>
      <Card className="space-y-4">
        <h2 className="font-semibold">Growth Timeline</h2>
        <AnalyticsChart type="line" data={data.timeline.map((d) => ({ label: d.date, value: d.signals }))} />
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left py-2">Month</th><th className="text-right py-2">Sources</th><th className="text-right py-2">Signals</th><th className="text-right py-2">Assets</th></tr></thead>
          <tbody>
            {data.timeline.map((row) => (
              <tr key={row.date} className="border-b border-border/50 hover:bg-accent/30">
                <td className="py-2">{row.date}</td>
                <td className="text-right py-2">{row.sources}</td>
                <td className="text-right py-2 text-primary">{row.signals}</td>
                <td className="text-right py-2 text-emerald-400">{row.assets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
