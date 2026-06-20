'use client';

import { useEffect, useState } from 'react';
import { api, type TrustSignal } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ContentAsset {
  id?: string;
  type: string;
  title: string;
  content: string;
  platform?: string;
}

export default function ContentPage() {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [signals, setSignals] = useState<TrustSignal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState('');
  const [generating, setGenerating] = useState(false);
  const [poweredBy, setPoweredBy] = useState('demo');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.getContent().then((d) => setAssets(d as ContentAsset[]));
    api.getTrustSignals().then((s) => { setSignals(s); if (s.length) setSelectedSignal(s[0].id); });
  }, []);

  async function generate() {
    if (!selectedSignal) return;
    setGenerating(true);
    try {
      const res = await api.generateContent(selectedSignal);
      setAssets(res.assets as ContentAsset[]);
      setPoweredBy(res.poweredBy);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Content Studio</h1>
          <p className="text-muted-foreground mt-2">Transform proof into LinkedIn posts, emails, case studies, and landing page assets.</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedSignal} onChange={(e) => setSelectedSignal(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
            {signals.map((s) => <option key={s.id} value={s.id}>{s.signalType} — {s.proofScore}/100</option>)}
          </select>
          <Button onClick={generate} disabled={generating}>{generating ? 'Generating...' : 'Generate Assets'}</Button>
        </div>
      </div>
      <Badge className="bg-secondary text-muted-foreground">Powered by: {poweredBy === 'faxxing' ? 'Faxxing' : 'Demo Mode'}</Badge>
      <div className="grid gap-4 lg:grid-cols-2">
        {assets.map((asset) => (
          <Card key={asset.title} hover className={`cursor-pointer space-y-3 ${expanded === asset.title ? 'ring-2 ring-primary' : ''}`} onClick={() => setExpanded(expanded === asset.title ? null : asset.title)}>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary">{asset.type}</Badge>
              {asset.platform && <Badge className="bg-secondary text-secondary-foreground">{asset.platform}</Badge>}
            </div>
            <h3 className="font-semibold">{asset.title}</h3>
            <p className={`text-sm text-muted-foreground whitespace-pre-line ${expanded ? '' : 'line-clamp-4'}`}>{asset.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
