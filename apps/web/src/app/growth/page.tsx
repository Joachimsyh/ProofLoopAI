'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getPriorityColor } from '@/lib/utils';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: string;
  impact: number;
  effort: number;
  category: string;
  actionItems: string[];
}

export default function GrowthPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [poweredBy, setPoweredBy] = useState('demo');

  useEffect(() => {
    api.getGrowth().then((d) => setRecommendations(d as Recommendation[]));
  }, []);

  async function analyze() {
    setAnalyzing(true);
    try {
      const res = await api.analyzeGrowth();
      setRecommendations(res.recommendations as Recommendation[]);
      setPoweredBy(res.poweredBy);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Growth Recommendations</h1>
          <p className="text-muted-foreground mt-2">Which proof converts best, which audience responds, and what to scale next.</p>
        </div>
        <Button onClick={analyze} disabled={analyzing}>{analyzing ? 'Analyzing...' : 'Run Growth Analysis'}</Button>
      </div>
      <Badge className="bg-secondary text-muted-foreground">Powered by: {poweredBy === 'scaile' ? 'Scaile' : 'Demo Mode'}</Badge>
      <div className="grid gap-4 lg:grid-cols-2">
        {recommendations.map((rec) => (
          <Card key={rec.id} hover className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{rec.title}</h3>
              <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{rec.description}</p>
            <Badge className="bg-secondary text-secondary-foreground">{rec.category}</Badge>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Impact</span><span className="text-emerald-400">{rec.impact}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${rec.impact}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Effort</span><span className="text-amber-400">{rec.effort}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${rec.effort}%` }} /></div>
              </div>
            </div>
            <ul className="space-y-1">{rec.actionItems.map((item) => (
              <li key={item} className="text-sm flex gap-2"><span className="text-primary">✓</span>{item}</li>
            ))}</ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
